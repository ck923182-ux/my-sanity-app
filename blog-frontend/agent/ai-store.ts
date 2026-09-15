import type { ApiStats } from "./types"
import type { ApiHealthDiagnosis } from "./ai/api-health-agent"

export type ApiHealthAiRecord = {
  key: string
  path: string
  method: string

  health: ApiStats["health"]
  issues: string[]

  taskId: string

  diagnosis?: ApiHealthDiagnosis

  createdAt: number
  updatedAt: number
}

const globalForAgentAi = globalThis as unknown as {
  __agentAiStore?: Map<string, ApiHealthAiRecord>
}

if (!globalForAgentAi.__agentAiStore) {
  globalForAgentAi.__agentAiStore = new Map()
}

const store = globalForAgentAi.__agentAiStore

function createIssueKey(stats: ApiStats): string {
  return `${stats.method}:${stats.path}:${stats.issues.join("|")}`
}

export function getAiDiagnosis(
  stats: ApiStats
): ApiHealthAiRecord | undefined {
  const key = createIssueKey(stats)

  return store.get(key)
}

export function saveAiTask(
  stats: ApiStats,
  taskId: string
): ApiHealthAiRecord {
  const key = createIssueKey(stats)

  const existing = store.get(key)

  const record: ApiHealthAiRecord = {
    key,
    path: stats.path,
    method: stats.method,
    health: stats.health,
    issues: stats.issues,
    taskId,
    diagnosis: existing?.diagnosis,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  }

  store.set(key, record)

  return record
}

export function saveAiDiagnosis(
  stats: ApiStats,
  diagnosis: ApiHealthDiagnosis
): ApiHealthAiRecord {
  const key = createIssueKey(stats)

  const existing = store.get(key)

  const record: ApiHealthAiRecord = {
    key,
    path: stats.path,
    method: stats.method,
    health: stats.health,
    issues: stats.issues,
    taskId: existing?.taskId ?? "",
    diagnosis,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  }

  store.set(key, record)

  return record
}

export function clearAiStore() {
  store.clear()
}

export function getAllAiDiagnoses(): ApiHealthAiRecord[] {
  return Array.from(store.values())
}