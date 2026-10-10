
import fs from "fs"
import path from "path"

export type IssueStatus = "open" | "resolved"

export type IssuePriority = "high" | "medium" | "low"

export type IssueHistoryRecord = {
  id: string

  fingerprint: string

  apiPath: string

  title: string

  status: IssueStatus

  priority: IssuePriority

  firstDetectedAt: number

  lastDetectedAt: number

  occurrenceCount: number

  investigationIds: string[]

  latestInvestigationId: string

  bottleneck?: {
    name: string
    duration: number
    percentage: number
  } | null

  rootCause?: {
    likelyCause: string
    explanation: string
    duration: number
    bottleneckDuration: number
    sourceLines: number[]
  } | null

  recommendation?: {
    title: string
    recommendation: string
    reason: string
    sourceLines: number[]
  } | null

  updatedAt: number
}

const DATA_FILE = path.resolve(
  process.cwd(),
  "agent",
  "data",
  "issues.json"
)

const MAX_ISSUES = 500

function ensureDataFile() {
  const directory = path.dirname(DATA_FILE)

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    })
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8")
  }
}

function readIssues(): IssueHistoryRecord[] {
  ensureDataFile()

  try {
    const content = fs.readFileSync(DATA_FILE, "utf8")

    if (!content.trim()) {
      return []
    }

    const data: unknown = JSON.parse(content)

    if (!Array.isArray(data)) {
      console.error("Issue history file must contain an array.")
      return []
    }

    return data as IssueHistoryRecord[]
  } catch (error) {
    console.error("Failed to read issue history:", error)
    return []
  }
}

function writeIssues(issues: IssueHistoryRecord[]) {
  ensureDataFile()

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(issues, null, 2),
    "utf8"
  )
}

function createFingerprint(
  apiPath: string,
  bottleneckName?: string | null,
  likelyCause?: string | null
) {
  const normalizedPath = apiPath.trim().toLowerCase()

  // Prefer the detected bottleneck because it is specific and
  // generally remains stable across repeated investigations.
  const normalizedProblem = (
    bottleneckName?.trim() ||
    likelyCause?.trim() ||
    "general-api-health"
  )
    .toLowerCase()
    .replace(/\s+/g, " ")

  return `${normalizedPath}::${normalizedProblem}`
}

export function getIssues(): IssueHistoryRecord[] {
  return readIssues().sort(
    (a, b) => b.lastDetectedAt - a.lastDetectedAt
  )
}

export function getIssueById(
  id: string
): IssueHistoryRecord | undefined {
  return readIssues().find((issue) => issue.id === id)
}

export function upsertIssue(input: {
  apiPath: string
  investigationId: string
  priority?: IssuePriority
  bottleneck?: IssueHistoryRecord["bottleneck"]
  rootCause?: IssueHistoryRecord["rootCause"]
  recommendation?: IssueHistoryRecord["recommendation"]
}): IssueHistoryRecord {
  const issues = readIssues()
  const now = Date.now()

  const fingerprint = createFingerprint(
    input.apiPath,
    input.bottleneck?.name,
    input.rootCause?.likelyCause
  )

  const existing = issues.find(
    (issue) => issue.fingerprint === fingerprint
  )

  if (existing) {
    // Avoid counting the same investigation twice.
    const alreadyLinked = existing.investigationIds.includes(
      input.investigationId
    )

    const updated: IssueHistoryRecord = {
      ...existing,
      status: "open",
      priority: input.priority ?? existing.priority,
      lastDetectedAt: alreadyLinked
        ? existing.lastDetectedAt
        : now,
      occurrenceCount: alreadyLinked
        ? existing.occurrenceCount
        : existing.occurrenceCount + 1,
      investigationIds: alreadyLinked
        ? existing.investigationIds
        : [
            input.investigationId,
            ...existing.investigationIds,
          ].slice(0, MAX_ISSUES),
      latestInvestigationId: alreadyLinked
        ? existing.latestInvestigationId
        : input.investigationId,
      bottleneck: input.bottleneck ?? existing.bottleneck,
      rootCause: input.rootCause ?? existing.rootCause,
      recommendation:
        input.recommendation ?? existing.recommendation,
      updatedAt: now,
    }

    const index = issues.findIndex(
      (issue) => issue.id === existing.id
    )

    issues[index] = updated
    writeIssues(issues)

    return updated
  }

  const issue: IssueHistoryRecord = {
    id: crypto.randomUUID(),
    fingerprint,
    apiPath: input.apiPath,
    title:
      input.bottleneck?.name
        ? `Slow operation: ${input.bottleneck.name}`
        : input.rootCause?.likelyCause || `API issue: ${input.apiPath}`,
    status: "open",
    priority: input.priority ?? "medium",
    firstDetectedAt: now,
    lastDetectedAt: now,
    occurrenceCount: 1,
    investigationIds: [input.investigationId],
    latestInvestigationId: input.investigationId,
    bottleneck: input.bottleneck ?? null,
    rootCause: input.rootCause ?? null,
    recommendation: input.recommendation ?? null,
    updatedAt: now,
  }

  issues.unshift(issue)

  writeIssues(issues.slice(0, MAX_ISSUES))

  return issue
}

export function resolveIssue(
  id: string
): IssueHistoryRecord | null {
  const issues = readIssues()

  const index = issues.findIndex(
    (issue) => issue.id === id
  )

  if (index === -1) {
    return null
  }

  const updated: IssueHistoryRecord = {
    ...issues[index],
    status: "resolved",
    updatedAt: Date.now(),
  }

  issues[index] = updated
  writeIssues(issues)

  return updated
}
