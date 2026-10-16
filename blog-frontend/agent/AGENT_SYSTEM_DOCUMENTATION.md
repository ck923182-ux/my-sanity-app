# AI API Monitoring Agent — Complete System Documentation

> **Project:** blog-frontend (Next.js)
> **Purpose:** Automatic runtime monitoring, AI-powered root cause analysis, and issue lifecycle management for all API routes.
> **AI Provider:** Manus AI (`https://api.manus.ai/v2`)
> **Database:** SQLite (`better-sqlite3`) for logs + JSON files for investigations/issues

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Full Architecture Flow](#2-full-architecture-flow)
3. [File-by-File Reference](#3-file-by-file-reference)
4. [All API Endpoints with Examples](#4-all-api-endpoints-with-examples)
5. [Data Models & Types](#5-data-models--types)
6. [Pending Phases (6–9)](#6-pending-phases-69)
7. [How to Instrument a New Route](#7-how-to-instrument-a-new-route)
8. [Environment Variables](#8-environment-variables)

---

## 1. SYSTEM OVERVIEW

The agent is a **self-contained runtime monitoring system** embedded inside your Next.js app.

Every monitored API route is wrapped with `withApiMonitoring()`. When a request comes in:

- The wrapper **records** timing, status, duplicate detection
- Stores it in **SQLite**
- After every request, **checks health thresholds** automatically
- If thresholds are breached → **reads your source file** to find the slow operation
- Sends all evidence to **Manus AI** for root cause analysis
- Saves the **investigation** and **issue** record (with deduplication)
- Exposes everything via **REST API endpoints** for your dashboard

### Key Design Decisions

| Decision | Why |
|---|---|
| SQLite for logs | Fast, synchronous, survives hot-reloads via `globalThis` singleton |
| JSON files for investigations/issues | Simple persistence, no external DB needed |
| `void` fire-and-forget for auto-investigation | Never blocks the actual API response |
| Fingerprint-based issue deduplication | Same problem → occurrence count, not duplicate issues |
| Manus structured output schema | Forces typed JSON from the LLM, no parsing guesswork |
| 10-minute cooldown per route | Prevents investigation spam on a failing endpoint |

---

## 2. FULL ARCHITECTURE FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        YOUR API ROUTE (e.g. /api/update-post)               │
│                         wrapped with withApiMonitoring()                    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           api-monitor.ts                                    │
│                                                                             │
│  1. Generate requestId (UUID)                                               │
│  2. Read request body for fingerprinting                                    │
│  3. Create fingerprint: METHOD + PATH + PARAMS + BODY                      │
│  4. reserveRequest() → SQLite atomic check (duplicate detection)            │
│  5. Run your handler with OperationRecorder                                 │
│     └── handler calls operations.measure("fetch()", () => fetch(...))      │
│  6. Record total duration                                                   │
│  7. addRequestLog() → store.ts → SQLite                                     │
│  8. void triggerAutomaticInvestigation()  ◄── FIRE AND FORGET               │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ (non-blocking)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        automatic-investigator.ts                            │
│                                                                             │
│  GATE 1: Is path /api/agent/* ? → SKIP                                     │
│  GATE 2: Is latest request 401/403? → SKIP                                 │
│  GATE 3: Less than 3 total requests? → SKIP                                │
│  GATE 4: Investigation in last 10 min? → SKIP (cooldown)                   │
│                                                                             │
│  TRIGGER A: serverErrorCalls ≥ 2 AND serverErrorRate ≥ 50%                 │
│  TRIGGER B: averageDuration ≥ 2000ms                                       │
│                                                                             │
│  If triggered → createInvestigation()                                      │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         investigation-service.ts                            │
│                                                                             │
│  STEP 1: GET /api/agent/source-analysis?path=...                           │
│           ├─ Resolve route.ts file from path                                │
│           ├─ Read source file from filesystem                               │
│           ├─ analyzeSource() → detect operations by regex                  │
│           │   (fetch, .patch, .commit, request.json, etc.)                 │
│           ├─ Get matching logs from SQLite                                  │
│           ├─ detectBottleneck() → slowest operation %                      │
│           ├─ analyzeRootCause() → map bottleneck to source line            │
│           └─ generateDeveloperRecommendation() → priority + fix text       │
│                                                                             │
│  STEP 2: Verify source file was found (throw if not)                       │
│                                                                             │
│  STEP 3: createSourceAnalysisTask() → POST to Manus AI                    │
│           └─ Returns taskId                                                 │
│                                                                             │
│  STEP 4: addInvestigation() → investigations.json                          │
│           └─ status: "processing", taskId saved                            │
│                                                                             │
│  STEP 5: upsertIssue() → issues.json                                       │
│           ├─ Fingerprint: apiPath::bottleneckName                          │
│           ├─ Match found → occurrenceCount++, lastDetectedAt updated       │
│           └─ No match → new issue created (status: "open")                 │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MANUS AI                                          │
│                    https://api.manus.ai/v2                                  │
│                                                                             │
│  task.create → submits prompt with all evidence                            │
│  task.listMessages → polls for structured_output_result                    │
│                                                                             │
│  Returns:                                                                   │
│  {                                                                          │
│    rootCause: "...",                                                        │
│    evidence: "...",                                                         │
│    source: "...",                                                           │
│    recommendation: "...",                                                   │
│    assumptions: "..."                                                       │
│  }                                                                          │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    POLLING: GET /api/agent/investigate/[taskId]             │
│                                                                             │
│  - Calls getSourceAnalysisDiagnosis(taskId)                                │
│  - If null → status: "processing" (Manus still working)                    │
│  - If result → updateInvestigation(id, { status: "completed", ai: result })│
│  - Returns final AI diagnosis to caller                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Storage Layer

```
SQLite (agent-monitoring.sqlite)          JSON Files
─────────────────────────────────         ───────────────────────────────
api_request_logs                          agent/data/investigations.json
  id, method, path, status,               agent/data/issues.json
  duration, timestamp,
  request_fingerprint,
  is_duplicate, duplicate_of,
  duplicate_count,
  operations_json

api_request_reservations
  request_id, fingerprint, timestamp
  (5-second window, auto-cleaned)
```

---

## 3. FILE-BY-FILE REFERENCE

### `agent/types.ts`
Core shared TypeScript types. Every other file imports from here.

```typescript
// A single timed sub-operation inside a request
type OperationTiming = {
  name: string      // e.g. "fetch()", ".commit()"
  duration: number  // milliseconds
}

// One logged API request
type ApiRequestLog = {
  id: string
  method: string
  path: string
  status: number
  duration: number
  timestamp: number
  userAgent?: string
  requestFingerprint?: string
  isDuplicate?: boolean
  duplicateOf?: string
  duplicateCount?: number
  operations?: OperationTiming[]
}

// Aggregated stats for one API path
type ApiStats = {
  path: string
  method: string
  totalCalls: number
  successCalls: number
  errorCalls: number
  averageDuration: number
  maxDuration: number
  duplicateCalls: number
  errorRate: number
  health: "healthy" | "warning" | "critical"
  issues: string[]
}
```

---

### `agent/runtime/database.ts`
SQLite singleton — created once, stored on `globalThis` to survive Next.js hot-reloads.

```typescript
// Creates 2 tables:
// api_request_logs      — primary log storage (indexed on timestamp, path+method)
// api_request_reservations — duplicate detection window (5 second TTL)

export const db = globalForDatabase.__agentDatabase ?? createDatabase()
```

**Storage path:** `{project_root}/data/agent-monitoring.sqlite`

---

### `agent/store.ts`
Read/write layer for request logs. All SQL queries are compiled as prepared statements.

```typescript
// Key functions:
addRequestLog(log)           // INSERT + trim to MAX 5000 rows
getRequestLogs()             // SELECT * ORDER BY timestamp DESC LIMIT 5000
clearRequestLogs()           // DELETE all logs + reservations
reserveRequest(id, fp, ts)   // Atomic SQLite transaction for duplicate detection
getRequestLogCount()         // COUNT(*)
```

**Duplicate detection logic (`reserveRequest`):**
- Runs inside a SQLite `IMMEDIATE` transaction (exclusive write lock)
- Deletes reservations older than 5 seconds
- Looks for matching fingerprints in the 5-second window
- If found → `{ isDuplicate: true, duplicateOf: firstMatchId, duplicateCount: N }`
- If not found → `{ isDuplicate: false, duplicateCount: 0 }`
- Inserts the current request into reservations

---

### `agent/runtime/api-monitor.ts`
The instrumentation wrapper. This is the only file you need to touch when adding monitoring to a route.

```typescript
// Wrap a route declaratively:
export const GET = withApiMonitoring(async (request, context, operations) => {
  const data = await operations.measure("fetch-posts", () =>
    fetch("https://api.example.com/posts")
  )
  return Response.json({ data })
})

// Or wrap imperatively inside a handler:
export async function POST(request: Request) {
  return monitorApi(request, async (operations) => {
    const body = await operations.measure("request.json()", () => request.json())
    // ... your logic
    return NextResponse.json({ success: true })
  })
}
```

**What it does per request:**
1. Reads body for fingerprinting (GET/HEAD skipped)
2. Builds fingerprint: `METHOD:PATH:SORTED_PARAMS:BODY`
3. Calls `reserveRequest()` (duplicate detection)
4. Runs your handler with `OperationRecorder`
5. Measures total `performance.now()` duration
6. Calls `addRequestLog()` → SQLite
7. Calls `void triggerAutomaticInvestigation()` (non-blocking)

---

### `agent/runtime/operation-monitor.ts`
Utility for timing a single async operation.

```typescript
const { result, timing } = await measureOperation("sanity-patch", async () => {
  return await client.patch(id).set(data).commit()
})
// timing = { name: "sanity-patch", duration: 3100 }
```

---

### `agent/runtime/route-matcher.ts`
Resolves a concrete request path to its canonical Next.js route pattern by scanning the filesystem.

```typescript
resolveApiRoute("/api/generate/status/abc-def-123")
// → "/api/generate/status/[taskId]"

resolveApiRoute("/api/posts/my-post-slug/comments")
// → "/api/posts/[slug]/comments"  (if [slug] folder exists)
```

Supports: exact segments, `[param]`, `[...catchAll]`, `[[...optionalCatchAll]]`

---

### `agent/runtime/duplicate-detector.ts`
Analysis-only utility (not used in real-time path). Given a list of logs, finds batches of identical requests within 1 second.

```typescript
detectDuplicateRequests(logs)
// → [{ method: "POST", path: "/api/update-post", count: 3, windowMs: 1000 }]
```

---

### `agent/analyzer/health-analyzer.ts`
The health scoring engine. Reads SQLite logs for a path and computes a health report.

```typescript
analyzeApiHealth("/api/update-post", "POST")
// Returns ApiHealthResult or null if no logs exist

// Health scoring rules:
// serverErrorRate >= 50%  → issue severity "high"  → health "critical"
// serverErrorRate >= 20%  → issue severity "medium" → health "warning"
// avgDuration >= 2000ms   → issue severity "high"   → health "critical"
// avgDuration >= 1000ms   → issue severity "medium" → health "warning"
// clientErrors > 0        → issue severity "low"    (401/403 don't affect health score)
// duplicateCalls > 0      → issue severity "low"
```

**Note:** Uses server errors (5xx) only for health severity. A batch of 401s won't make your endpoint "critical".

---

### `agent/analyzer/bottleneck-analyzer.ts`
Finds the single slowest operation in a request's timing array.

```typescript
detectBottleneck(3420, [
  { name: "request.json()", duration: 12 },
  { name: ".commit()", duration: 3100 },
  { name: "NextResponse.json()", duration: 8 }
])
// → { name: ".commit()", duration: 3100, percentage: 90 }
```

---

### `agent/analyzer/source-analyzer.ts`
Static analysis of a route handler's source code. Regex-matches known async operation patterns and extracts their line numbers.

**Detected patterns:**

| Pattern | Type |
|---|---|
| `request.json()` | request |
| `request.formData()` | request |
| `fetch()` | external-api |
| `.patch()` | database |
| `.create()` | database |
| `.createIfNotExists()` | database |
| `.delete()` | database |
| `.commit()` | database |
| `NextResponse.json()` | response |
| `Response.json()` | response |

```typescript
analyzeSource(sourceCode, "app/api/update-post/route.ts")
// → {
//     filePath: "app/api/update-post/route.ts",
//     operations: [
//       { name: "request.json()", type: "request", line: 8, code: "const body = await request.json()" },
//       { name: ".commit()", type: "database", line: 34, code: "await transaction.commit()" }
//     ]
//   }

extractSourceContext(source, [34], 3)
// → { startLine: 31, endLine: 37, code: "31: ...\n32: ...\n34: await transaction.commit()\n..." }
```

---

### `agent/analyzer/bottleneck-analyzer.ts` + `developer-recommendation-analyzer.ts`
Generates human-readable developer fix recommendations.

```typescript
generateDeveloperRecommendation({
  category: "database-operation",
  confidence: "high",
  operation: ".commit()",
  duration: 3100,
  percentage: 90,
  evidence: [...]
})
// → {
//     priority: "high",
//     title: "Investigate database operation latency",
//     recommendation: "Investigate the .commit() operation because it accounts for 90% of the measured request duration...",
//     reason: ".commit() took 3100ms and represents 90% of the measured request duration.",
//     sourceLines: [34]
//   }
```

---

### `agent/ai/api-health-agent.ts`
Manus AI integration for health-level diagnosis.

```typescript
// Create task → returns taskId
const { taskId } = await createApiHealthTask(apiStats)

// Poll for result (returns null if still processing)
const diagnosis = await getApiHealthDiagnosis(taskId)
// → {
//     severity: "critical",
//     diagnosis: "The API has a 75% server error rate...",
//     recommendation: "Check database connection pooling...",
//     investigationArea: "Database layer / connection management"
//   }
```

**Manus task config:**
- `agent_profile: "lite"` — fast, cheap
- `hide_in_task_list: true` — doesn't appear in Manus UI task list
- `share_visibility: "private"` — not shared
- `structured_output_schema` — enforces typed JSON output

---

### `agent/ai/source-analysis-agent.ts`
Manus AI integration for deep source-level analysis.

```typescript
const { taskId } = await createSourceAnalysisTask({
  apiPath: "/api/update-post",
  runtime: { duration: 3420, status: 500 },
  bottleneck: { name: ".commit()", duration: 3100, percentage: 90 },
  rootCause: { likelyCause: ".commit()", explanation: "...", sourceLines: [34] },
  developerRecommendation: { priority: "high", title: "...", ... },
  sourceContext: { startLine: 31, endLine: 37, code: "31: ...\n34: await transaction.commit()" }
})

const diagnosis = await getSourceAnalysisDiagnosis(taskId)
// → {
//     rootCause: "The Sanity .commit() call blocks synchronously for 3100ms...",
//     evidence: "Runtime data shows commit is 90% of total 3420ms request...",
//     source: "Line 34: await transaction.commit() — this is a blocking awaited call...",
//     recommendation: "Wrap in Promise.race with a 2-second timeout, add retry logic...",
//     assumptions: "Assuming Sanity is on remote network, not same-process..."
//   }
```

---

### `agent/ai/api-health-prompt.ts` + `source-analysis-prompt.ts`
Build the LLM prompt strings from structured data. Includes all relevant stats/evidence and instructions to stay factual.

---

### `agent/ai-store.ts`
In-memory cache (on `globalThis`) for AI health diagnosis records. Prevents re-submitting the same issue to Manus when it's already running or completed.

```typescript
// Key format: "METHOD:PATH:issue1|issue2"
getAiDiagnosis(stats)        // lookup existing record
saveAiTask(stats, taskId)    // record new task submission
saveAiDiagnosis(stats, diag) // record completed diagnosis
getAllAiDiagnoses()           // all cached records
clearAiStore()               // wipe cache
```

---

### `agent/investigation-store.ts`
File-based persistence for investigation records (`agent/data/investigations.json`). Max 100 entries.

```typescript
addInvestigation(record)           // prepend, trim to 100
getInvestigations()                // all records
getInvestigationById(id)           // single lookup
updateInvestigation(id, updates)   // partial update (used when Manus completes)
clearInvestigations()              // wipe file
```

---

### `agent/issue-store.ts`
File-based persistence for issues (`agent/data/issues.json`). Max 500 entries. Deduplication via fingerprint.

```typescript
// Fingerprint = "apipath::bottleneckname"  (lowercase)
// e.g. "/api/update-post::.commit()"

upsertIssue(input)           // create or update (increment occurrenceCount)
getIssues()                  // all issues, sorted by lastDetectedAt
getIssueById(id)             // single lookup
updateIssueStatus(id, status)// "open" | "investigating" | "resolved"
resolveIssue(id)             // shortcut for updateIssueStatus(id, "resolved")
```

---

### `agent/investigation-service.ts`
Orchestrates the full investigation pipeline. Called by both the automatic investigator and the manual `/api/agent/investigate` endpoint.

```typescript
await createInvestigation("/api/update-post", request.url)
// Internally:
// 1. GET /api/agent/source-analysis?path=/api/update-post
// 2. Verify found: true
// 3. createSourceAnalysisTask() → Manus AI → taskId
// 4. addInvestigation({ status: "processing", taskId, ... })
// 5. upsertIssue({ apiPath, investigationId, priority, bottleneck, rootCause })
// Returns: { investigationId, apiPath, taskId, sourceAnalysis, issueId }
```

---

### `agent/automatic-investigator.ts`
Decision engine + trigger for automatic investigations.

```typescript
// Called after EVERY monitored request (fire-and-forget):
await triggerAutomaticInvestigation("/api/update-post", request.url)

// Skip conditions:
// - Path starts with /api/agent
// - Latest request was 401 or 403
// - Less than 3 total requests recorded
// - Investigation created within last 10 minutes for this route

// Trigger conditions (either one):
// A: serverErrorCalls >= 2 AND serverErrorRate >= 50%
// B: averageDuration >= 2000ms
```

---

### `agent/scanner/api-source-scanner.ts`
Alternative filesystem scanner for route resolution. Recursively finds `route.ts` with support for dynamic segments.

---

### `agent/data/investigations.json`
Persistent array of `InvestigationHistoryRecord`. Written on every investigation create/update.

---

### `agent/data/issues.json`
Persistent array of `IssueHistoryRecord`. Written on every upsert/status update.

---

### `11proxy.ts` (root level)
**Status: Dead code / historical artifact.** The tracking call is commented out. Active monitoring happens via `withApiMonitoring()` per-route, not via middleware.

---

## 4. ALL API ENDPOINTS WITH EXAMPLES

### BASE URL: `/api/agent/`

---

### `GET /api/agent/logs`
Returns all raw request logs from SQLite.

**Purpose:** Debug dashboard, raw data source.

**Request:**
```bash
GET /api/agent/logs
```

**Response:**
```json
{
  "total": 47,
  "logs": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "method": "POST",
      "path": "/api/update-post",
      "status": 500,
      "duration": 3420,
      "timestamp": 1728000000000,
      "userAgent": "Mozilla/5.0...",
      "requestFingerprint": "POST:/api/update-post::body-hash",
      "isDuplicate": false,
      "duplicateOf": null,
      "duplicateCount": 0,
      "operations": [
        { "name": "request.json()", "duration": 12 },
        { "name": ".commit()", "duration": 3100 }
      ]
    }
  ]
}
```

---

### `GET /api/agent/stats`
Aggregated health summary per unique API route + method.

**Purpose:** Main dashboard overview — all your APIs and their health.

**Request:**
```bash
GET /api/agent/stats
```

**Response:**
```json
{
  "totalRequests": 47,
  "stats": [
    {
      "path": "/api/update-post",
      "method": "POST",
      "health": "critical",
      "totalCalls": 12,
      "successCalls": 3,
      "errorCalls": 9,
      "serverErrorCalls": 9,
      "clientErrorCalls": 0,
      "averageDuration": 3200,
      "maxDuration": 5100,
      "errorRate": 75.0,
      "duplicateCalls": 0,
      "issues": [
        {
          "type": "high-server-error-rate",
          "message": "API server error rate is 75.0%.",
          "severity": "high"
        },
        {
          "type": "very-slow-api",
          "message": "Average response time is 3200ms.",
          "severity": "high"
        }
      ]
    },
    {
      "path": "/api/posts",
      "method": "GET",
      "health": "healthy",
      "totalCalls": 35,
      "errorRate": 0,
      "averageDuration": 280,
      "issues": []
    }
  ]
}
```

---

### `GET /api/agent/analyze?path=...&method=...`
Deep health analysis for one specific API path.

**Purpose:** Drill into a single route. Full issue breakdown.

**Request:**
```bash
GET /api/agent/analyze?path=/api/update-post&method=POST
```

**Response:**
```json
{
  "success": true,
  "found": true,
  "analysis": {
    "path": "/api/update-post",
    "method": "POST",
    "health": "critical",
    "totalCalls": 12,
    "successCalls": 3,
    "errorCalls": 9,
    "serverErrorCalls": 9,
    "clientErrorCalls": 0,
    "averageDuration": 3200,
    "maxDuration": 5100,
    "errorRate": 75.0,
    "duplicateCalls": 0,
    "issues": [
      {
        "type": "high-server-error-rate",
        "message": "API server error rate is 75.0%.",
        "severity": "high"
      }
    ]
  }
}
```

**Response (no data):**
```json
{
  "success": true,
  "found": false,
  "message": "No monitoring data found for /api/update-post"
}
```

---

### `GET /api/agent/source-scan?path=...`
Returns the raw source code of a route handler file.

**Purpose:** Verify the agent can find your file. Debug route resolution.

**Request:**
```bash
GET /api/agent/source-scan?path=/api/update-post
```

**Response:**
```json
{
  "success": true,
  "found": true,
  "apiPath": "/api/update-post",
  "filePath": "app/api/update-post/route.ts",
  "source": "import { NextResponse } from 'next/server'\nimport { withApiMonitoring } from '@/agent/runtime/api-monitor'\n..."
}
```

**Response (not found):**
```json
{
  "success": true,
  "found": false,
  "apiPath": "/api/update-post",
  "message": "Source file could not be found.",
  "searchedPaths": [
    "app/api/update-post/route.ts",
    "app/api/update-post/route.js"
  ]
}
```

---

### `GET /api/agent/source-analysis?path=...`
Full automated source + runtime analysis. The most powerful read endpoint.

**Purpose:** Combines runtime logs + static source analysis → bottleneck + root cause + recommendation + annotated source.

**Request:**
```bash
GET /api/agent/source-analysis?path=/api/update-post
```

**Response:**
```json
{
  "success": true,
  "found": true,
  "apiPath": "/api/update-post",
  "filePath": "app/api/update-post/route.ts",
  "operations": [
    { "name": "request.json()", "type": "request", "line": 8, "code": "const body = await request.json()" },
    { "name": ".patch()", "type": "database", "line": 22, "code": "client.patch(body.id).set({ title: body.title })" },
    { "name": ".commit()", "type": "database", "line": 34, "code": "await transaction.commit()" }
  ],
  "runtime": {
    "duration": 3420,
    "status": 500,
    "timestamp": 1728000000000,
    "operations": [
      { "name": "request.json()", "duration": 12 },
      { "name": ".commit()", "duration": 3100 }
    ]
  },
  "bottleneck": {
    "name": ".commit()",
    "duration": 3100,
    "percentage": 90
  },
  "sourceLocation": {
    "operation": ".commit()",
    "filePath": "app/api/update-post/route.ts",
    "lines": [34],
    "matches": [
      { "name": ".commit()", "type": "database", "line": 34, "code": "await transaction.commit()" }
    ]
  },
  "sourceContext": {
    "startLine": 31,
    "endLine": 37,
    "code": "31: try {\n32:   const transaction = client.transaction()\n33:   transaction.patch(id).set(data)\n34:   await transaction.commit()\n35: } catch (error) {\n36:   return NextResponse.json({ error }, { status: 500 })\n37: }"
  },
  "rootCause": {
    "likelyCause": ".commit()",
    "explanation": ".commit() accounts for 3100ms of the 3420ms request.",
    "duration": 3420,
    "bottleneckDuration": 3100,
    "sourceLines": [34]
  },
  "developerRecommendation": {
    "priority": "high",
    "title": "Investigate database operation latency",
    "recommendation": "Investigate the .commit() operation because it accounts for 90% of the measured request duration. Measure the database/network operation separately and verify the database response time before optimizing other parts of the API.",
    "reason": ".commit() took 3100ms and represents 90% of the measured request duration.",
    "sourceLines": [34]
  }
}
```

---

### `GET /api/agent/health-ai`
Finds the first warning/critical API and submits it to Manus AI for health diagnosis.

**Purpose:** Entry point for AI-powered health analysis. Returns a `taskId` to poll.

**Request:**
```bash
GET /api/agent/health-ai
```

**Response (new task created):**
```json
{
  "success": true,
  "message": "API health analysis task created",
  "status": "running",
  "taskId": "manus_task_abc123",
  "api": {
    "path": "/api/update-post",
    "method": "POST",
    "health": "critical",
    "errorRate": 75.0,
    "averageDuration": 3200
  },
  "diagnosis": null
}
```

**Response (already completed, from cache):**
```json
{
  "success": true,
  "message": "Existing AI diagnosis returned",
  "status": "completed",
  "taskId": "manus_task_abc123",
  "diagnosis": {
    "severity": "critical",
    "diagnosis": "The API has a 75% server error rate across 12 requests. The average response time of 3200ms suggests a database or external service timeout is causing cascading failures.",
    "recommendation": "Check database connection pooling. Add a timeout to the Sanity .commit() call. Consider wrapping in a retry with exponential backoff.",
    "investigationArea": "Database layer — Sanity client commit operation"
  }
}
```

**Response (no problems):**
```json
{
  "success": true,
  "message": "No warning or critical API found",
  "diagnosis": null
}
```

---

### `GET /api/agent/health-ai/[taskId]`
Polls Manus AI for health diagnosis result.

**Purpose:** Call repeatedly after `GET /api/agent/health-ai` until `status: "completed"`.

**Request:**
```bash
GET /api/agent/health-ai/manus_task_abc123
```

**Response (processing):**
```json
{
  "success": true,
  "status": "running",
  "taskId": "manus_task_abc123",
  "diagnosis": null
}
```

**Response (completed):**
```json
{
  "success": true,
  "status": "completed",
  "taskId": "manus_task_abc123",
  "diagnosis": {
    "severity": "critical",
    "diagnosis": "75% server error rate with 3200ms average response time...",
    "recommendation": "Add connection pooling, timeout guard, and retry logic...",
    "investigationArea": "Database layer"
  }
}
```

---

### `POST /api/agent/source-ai`
Manually submit source evidence to Manus AI for deep source analysis.

**Purpose:** Lower-level endpoint — send any source evidence directly to Manus. Used internally by `investigation-service.ts`.

**Request:**
```bash
POST /api/agent/source-ai
Content-Type: application/json
```

```json
{
  "apiPath": "/api/update-post",
  "runtime": {
    "duration": 3420,
    "status": 500
  },
  "bottleneck": {
    "name": ".commit()",
    "duration": 3100,
    "percentage": 90
  },
  "rootCause": {
    "likelyCause": ".commit()",
    "explanation": ".commit() accounts for 3100ms of the 3420ms request.",
    "duration": 3420,
    "bottleneckDuration": 3100,
    "sourceLines": [34]
  },
  "developerRecommendation": {
    "priority": "high",
    "title": "Investigate database operation latency",
    "recommendation": "Investigate the .commit() operation...",
    "reason": ".commit() took 3100ms...",
    "sourceLines": [34]
  },
  "sourceContext": {
    "startLine": 31,
    "endLine": 37,
    "code": "31: try {\n32:   const transaction = client.transaction()\n34:   await transaction.commit()\n37: }"
  }
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "manus_task_xyz789",
  "apiPath": "/api/update-post",
  "message": "Source analysis AI task created successfully."
}
```

---

### `GET /api/agent/source-ai/[taskId]`
Polls Manus AI for source analysis result.

**Request:**
```bash
GET /api/agent/source-ai/manus_task_xyz789
```

**Response (processing):**
```json
{
  "success": true,
  "taskId": "manus_task_xyz789",
  "status": "processing",
  "diagnosis": null
}
```

**Response (completed):**
```json
{
  "success": true,
  "taskId": "manus_task_xyz789",
  "status": "completed",
  "diagnosis": {
    "rootCause": "The Sanity .commit() call is blocking the event loop for 3100ms, accounting for 90% of the total request duration. This is likely caused by network latency to the Sanity API or an unoptimized mutation payload.",
    "evidence": "Runtime data shows .commit() took 3100ms out of total 3420ms. HTTP status 500 confirms the request failed, likely after a timeout threshold was exceeded.",
    "source": "Line 34: await transaction.commit() — this is the single blocking async call that represents the entire DB write operation.",
    "recommendation": "1. Add a timeout: wrap commit() in Promise.race with a 3-second AbortController. 2. Move large mutations to a background queue. 3. Check Sanity API latency from your server region. 4. Consider batching smaller patches instead of one large commit.",
    "assumptions": "Assuming Sanity is hosted remotely (not same process). Assuming no CDN or cache layer exists in front of this endpoint."
  }
}
```

---

### `POST /api/agent/investigate`
Manually kick off a full investigation for any API path.

**Purpose:** The main action endpoint. Runs the full pipeline: source analysis → Manus AI → saves investigation + issue.

**Request:**
```bash
POST /api/agent/investigate
Content-Type: application/json
```

```json
{
  "path": "/api/update-post"
}
```

**Response:**
```json
{
  "success": true,
  "investigationId": "550e8400-e29b-41d4-a716-446655440000",
  "apiPath": "/api/update-post",
  "sourceAnalysis": {
    "filePath": "app/api/update-post/route.ts",
    "runtime": {
      "duration": 3420,
      "status": 500
    },
    "bottleneck": {
      "name": ".commit()",
      "duration": 3100,
      "percentage": 90
    },
    "rootCause": {
      "likelyCause": ".commit()",
      "explanation": ".commit() accounts for 3100ms of the 3420ms request.",
      "duration": 3420,
      "bottleneckDuration": 3100,
      "sourceLines": [34]
    },
    "developerRecommendation": {
      "priority": "high",
      "title": "Investigate database operation latency",
      "recommendation": "Investigate the .commit() operation...",
      "reason": ".commit() took 3100ms...",
      "sourceLines": [34]
    },
    "sourceContext": {
      "startLine": 31,
      "endLine": 37,
      "code": "31: try {\n34: await transaction.commit()\n37: }"
    }
  },
  "ai": {
    "taskId": "manus_task_xyz789",
    "status": "processing"
  },
  "message": "API investigation started successfully."
}
```

---

### `GET /api/agent/investigate/[taskId]`
Polls Manus AI for investigation result AND auto-updates the investigation record on completion.

**Purpose:** The polling companion to `POST /api/agent/investigate`.

**Request:**
```bash
GET /api/agent/investigate/manus_task_xyz789
```

**Response (processing):**
```json
{
  "success": true,
  "taskId": "manus_task_xyz789",
  "status": "processing",
  "ai": null
}
```

**Response (completed — investigation-store also updated automatically):**
```json
{
  "success": true,
  "taskId": "manus_task_xyz789",
  "status": "completed",
  "ai": {
    "rootCause": "The Sanity .commit() call blocks for 3100ms...",
    "evidence": "90% of request time is in a single database commit...",
    "source": "Line 34: await transaction.commit()",
    "recommendation": "Add timeout + retry logic to commit call...",
    "assumptions": "Sanity is on remote network..."
  }
}
```

---

### `GET /api/agent/investigations`
Returns all saved investigation history.

**Purpose:** Investigation log / audit trail.

**Request:**
```bash
GET /api/agent/investigations
```

**Response:**
```json
{
  "success": true,
  "total": 3,
  "investigations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "apiPath": "/api/update-post",
      "status": "completed",
      "createdAt": 1728000000000,
      "taskId": "manus_task_xyz789",
      "sourceAnalysis": {
        "filePath": "app/api/update-post/route.ts",
        "bottleneck": { "name": ".commit()", "duration": 3100, "percentage": 90 },
        "rootCause": { "likelyCause": ".commit()", ... },
        "developerRecommendation": { "priority": "high", ... }
      },
      "ai": {
        "rootCause": "...",
        "evidence": "...",
        "source": "...",
        "recommendation": "...",
        "assumptions": "..."
      }
    }
  ]
}
```

---

### `GET /api/agent/investigations/[id]`
Fetch a single investigation by its UUID.

**Request:**
```bash
GET /api/agent/investigations/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "success": true,
  "investigation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "apiPath": "/api/update-post",
    "status": "completed",
    ...
  }
}
```

---

### `GET /api/agent/issues`
Returns all deduplicated issues with summary counts.

**Purpose:** Issue tracker dashboard — recurring problems, priority, lifecycle status.

**Request:**
```bash
GET /api/agent/issues
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 5,
    "open": 3,
    "investigating": 1,
    "resolved": 1,
    "recurring": 2
  },
  "issues": [
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "fingerprint": "/api/update-post::.commit()",
      "apiPath": "/api/update-post",
      "title": "Slow operation: .commit()",
      "status": "open",
      "priority": "high",
      "firstDetectedAt": 1727000000000,
      "lastDetectedAt": 1728000000000,
      "occurrenceCount": 4,
      "reopenedCount": 0,
      "investigationIds": [
        "550e8400-e29b-41d4-a716-446655440000",
        "660e9511-f30c-52e5-b827-557766551111"
      ],
      "latestInvestigationId": "550e8400-e29b-41d4-a716-446655440000",
      "bottleneck": { "name": ".commit()", "duration": 3100, "percentage": 90 },
      "rootCause": { "likelyCause": ".commit()", "explanation": "..." },
      "recommendation": {
        "title": "Investigate database operation latency",
        "recommendation": "Investigate the .commit() operation...",
        "reason": ".commit() took 3100ms...",
        "sourceLines": [34]
      },
      "updatedAt": 1728000000000
    }
  ]
}
```

---

### `PATCH /api/agent/issues/[id]`
Update an issue's lifecycle status.

**Purpose:** Phase 6 lifecycle management — manually move an issue through statuses.

**Request:**
```bash
PATCH /api/agent/issues/6ba7b810-9dad-11d1-80b4-00c04fd430c8
Content-Type: application/json
```

```json
{ "status": "investigating" }
```

**Valid status values:** `"open"` | `"investigating"` | `"resolved"`

**Response:**
```json
{
  "success": true,
  "issue": {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "apiPath": "/api/update-post",
    "status": "investigating",
    "updatedAt": 1728000001000,
    ...
  }
}
```

**Response (invalid status):**
```json
{
  "success": false,
  "error": "Invalid status. Use \"open\", \"investigating\", or \"resolved\"."
}
```

---

### `GET /api/agent/test-request`
Simple monitored test endpoint.

**Purpose:** Generate test traffic and verify the full monitoring pipeline end-to-end.

**Request:**
```bash
GET /api/agent/test-request
```

**Response:**
```json
{
  "success": true,
  "message": "Test request successful"
}
```

**Behind the scenes:** Logged to SQLite via `withApiMonitoring()`. Auto-investigation check fires after every call. After 3+ calls with issues → investigation triggered.

---

## 5. DATA MODELS & TYPES

### `ApiRequestLog` (SQLite)
```typescript
{
  id: string                    // UUID
  method: string                // "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string                  // "/api/update-post"
  status: number                // 200, 500, etc.
  duration: number              // total ms
  timestamp: number             // Unix ms
  userAgent?: string
  requestFingerprint?: string   // "METHOD:PATH:PARAMS:BODY"
  isDuplicate?: boolean
  duplicateOf?: string          // request ID of the original
  duplicateCount?: number       // how many in the 5s window
  operations?: OperationTiming[] // sub-operation timings
}
```

### `InvestigationHistoryRecord` (JSON)
```typescript
{
  id: string                        // UUID
  apiPath: string
  createdAt: number
  status: "processing" | "completed" | "failed"
  taskId?: string                   // Manus task ID
  sourceAnalysis?: {
    filePath?: string
    runtime?: { duration, status } | null
    bottleneck?: { name, duration, percentage } | null
    rootCause?: { likelyCause, explanation, duration, bottleneckDuration, sourceLines } | null
    developerRecommendation?: { priority, title, recommendation, reason, sourceLines } | null
    sourceContext?: { startLine, endLine, code } | null
  }
  ai?: SourceAnalysisDiagnosis | null
  error?: string
}
```

### `IssueHistoryRecord` (JSON)
```typescript
{
  id: string                        // UUID
  fingerprint: string               // "apipath::bottleneckname"
  apiPath: string
  title: string                     // "Slow operation: .commit()"
  status: "open" | "investigating" | "resolved"
  priority: "high" | "medium" | "low"
  firstDetectedAt: number
  lastDetectedAt: number
  occurrenceCount: number           // increments on each new investigation
  reopenedCount?: number            // increments if resolved then re-detected
  investigationIds: string[]        // all linked investigation IDs
  latestInvestigationId: string
  bottleneck?: { name, duration, percentage } | null
  rootCause?: { likelyCause, explanation, duration, bottleneckDuration, sourceLines } | null
  recommendation?: { title, recommendation, reason, sourceLines } | null
  updatedAt: number
}
```

### `SourceAnalysisDiagnosis` (from Manus AI)
```typescript
{
  rootCause: string       // What is actually causing the issue
  evidence: string        // Concrete data supporting the conclusion
  source: string          // Specific source lines and what they do
  recommendation: string  // Step-by-step fix suggestions
  assumptions: string     // What couldn't be confirmed from the data
}
```

### `ApiHealthDiagnosis` (from Manus AI)
```typescript
{
  severity: "info" | "warning" | "critical"
  diagnosis: string        // What the health data reveals
  recommendation: string   // What the developer should do
  investigationArea: string // Where to look (e.g., "Database layer")
}
```

---

## 6. PENDING PHASES (6–9)

### Phase 6 — Automatic Issue Lifecycle

**What's missing:**
- Auto-transition issue to `"investigating"` when a new investigation starts for it
- Auto-reopen `"resolved"` issues if the same fingerprint recurs (partial — `reopenedCount` tracked but status stays `"open"`, not explicitly reopened from resolved)
- Scheduled health checks that re-evaluate `"resolved"` issues to confirm they're truly resolved
- Batch status updates

**Where to add it:**
- `investigation-service.ts` → after `upsertIssue()`, if issue exists and status is `"open"`, call `updateIssueStatus(id, "investigating")`
- `issue-store.ts` → in `upsertIssue()`, if `isReopened === true`, set status back to `"open"`

---

### Phase 7 — Reliable Monitoring & Alerting

**What's missing:**
- No alerting (email, Slack, webhook) when a critical issue is detected
- No background polling to auto-complete `"processing"` investigations (currently only polled on-demand)
- No retry logic on Manus API failures
- No rate limiting on investigation creation

**Where to add it:**
- New `agent/alerting/` folder with webhook/Slack notifier
- A background job (cron or Next.js route with `setInterval`) to poll pending investigations
- Retry wrapper around Manus `fetch()` calls in `api-health-agent.ts` and `source-analysis-agent.ts`

---

### Phase 8 — Safe Remediation

**What's missing:**
- No remediation actions — the agent only diagnoses, never acts
- No code suggestions written back to files
- No PR creation or automated fix application

**Where to add it:**
- New `agent/remediation/` folder
- A new endpoint `POST /api/agent/remediate/[issueId]` that takes the AI recommendation and applies a safe, reversible code change (e.g., add timeout wrapper)
- Must include dry-run mode and rollback

---

### Phase 9 — Testing & Production Readiness

**What's missing:**
- `agent/scanner/project-scanner.ts` is empty
- `agent/runtime/request-tracker.ts` is empty
- `11proxy.ts` middleware is dead code (monitoring is opt-in per-route, not automatic)
- No test suite (unit tests for health-analyzer, bottleneck-analyzer, route-matcher)
- No load testing or chaos testing setup
- No circuit breaker for Manus API failures

---

## 7. HOW TO INSTRUMENT A NEW ROUTE

### Option A — Declarative wrapper (recommended)
```typescript
// app/api/your-route/route.ts
import { withApiMonitoring } from "@/agent/runtime/api-monitor"

export const GET = withApiMonitoring(async (request, context, operations) => {
  // Use operations.measure() to time sub-operations
  const data = await operations.measure("fetch-external", () =>
    fetch("https://api.external.com/data")
  )

  const parsed = await operations.measure("parse-response", () =>
    data.json()
  )

  return Response.json({ parsed })
})

export const POST = withApiMonitoring(async (request, context, operations) => {
  const body = await operations.measure("request.json()", () =>
    request.json()
  )

  const result = await operations.measure(".commit()", () =>
    sanityClient.patch(body.id).set(body.data).commit()
  )

  return Response.json({ success: true, result })
})
```

### Option B — Imperative (for complex handlers)
```typescript
import { monitorApi } from "@/agent/runtime/api-monitor"

export async function POST(request: Request) {
  return monitorApi(request, async (operations) => {
    const body = await operations.measure("request.json()", () =>
      request.json()
    )
    // ... your handler logic
    return NextResponse.json({ success: true })
  })
}
```

### What gets recorded automatically:
- Total request duration
- HTTP status code
- Duplicate detection (same request within 5 seconds)
- All named sub-operations and their individual durations
- User agent
- Request fingerprint

### What triggers automatic investigation:
After wrapping your route, the agent will automatically investigate if:
- ≥3 requests have been recorded for the route
- AND no investigation was created in the last 10 minutes
- AND either: server error rate ≥50% (with ≥2 server errors), OR average latency ≥2000ms

---

## 8. ENVIRONMENT VARIABLES

```bash
# Required for AI features (health-ai, source-ai, investigate endpoints)
MANUS_API_KEY=your_manus_api_key_here
```

Without `MANUS_API_KEY`:
- All monitoring, logging, health analysis, and source scanning still work
- Only the AI diagnosis endpoints (`/api/agent/health-ai`, `/api/agent/source-ai`, `/api/agent/investigate`) will throw: `"MANUS_API_KEY is not set"`

---

## QUICK REFERENCE — ENDPOINT CHEAT SHEET

```
READ / DASHBOARD
  GET  /api/agent/logs                     → raw request logs
  GET  /api/agent/stats                    → health summary all APIs
  GET  /api/agent/analyze?path=...         → health detail one API
  GET  /api/agent/source-scan?path=...     → raw source file
  GET  /api/agent/source-analysis?path=... → full source + runtime analysis

AI DIAGNOSIS (2-step poll pattern)
  GET  /api/agent/health-ai                → start/check health AI task
  GET  /api/agent/health-ai/[taskId]       → poll health AI result
  POST /api/agent/source-ai               → start source AI task manually
  GET  /api/agent/source-ai/[taskId]       → poll source AI result

INVESTIGATIONS
  POST /api/agent/investigate             → start full investigation
  GET  /api/agent/investigate/[taskId]     → poll + auto-complete investigation
  GET  /api/agent/investigations           → all investigation history
  GET  /api/agent/investigations/[id]      → single investigation

ISSUE LIFECYCLE
  GET   /api/agent/issues                  → all issues + summary
  PATCH /api/agent/issues/[id]             → update status (open/investigating/resolved)

TESTING
  GET  /api/agent/test-request             → monitored test endpoint
```
