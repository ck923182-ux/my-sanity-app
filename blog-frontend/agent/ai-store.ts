
import type { ApiStats } from "./types";
import type { ApiHealthDiagnosis } from "./ai/api-health-agent";

export type AiTaskStatus =
  | "pending"
  | "completed"
  | "failed"
  | "timed_out";

export type ApiHealthAiRecord = {
  key: string;
  path: string;
  method: string;
  health: ApiStats["health"];
  issues: string[];
  taskId: string;
  status: AiTaskStatus;
  diagnosis?: ApiHealthDiagnosis;
  error?: string;
  createdAt: number;
  updatedAt: number;
};

const globalForAgentAi = globalThis as unknown as {
  __agentAiStore?: Map<string, ApiHealthAiRecord>;
};

if (!globalForAgentAi.__agentAiStore) {
  globalForAgentAi.__agentAiStore = new Map();
}

const store = globalForAgentAi.__agentAiStore;

function createIssueKey(stats: ApiStats): string {
  return `${stats.method}:${stats.path}:${stats.issues.join("|")}`;
}

export function getAiDiagnosis(
  stats: ApiStats,
): ApiHealthAiRecord | undefined {
  return store.get(createIssueKey(stats));
}

export function getAiTaskById(
  taskId: string,
): ApiHealthAiRecord | undefined {
  return Array.from(store.values()).find(
    (record) => record.taskId === taskId,
  );
}

export function saveAiTask(
  stats: ApiStats,
  taskId: string,
): ApiHealthAiRecord {
  const key = createIssueKey(stats);
  const now = Date.now();

  const record: ApiHealthAiRecord = {
    key,
    path: stats.path,
    method: stats.method,
    health: stats.health,
    issues: [...stats.issues],
    taskId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  store.set(key, record);

  return record;
}

export function saveAiDiagnosis(
  taskId: string,
  diagnosis: ApiHealthDiagnosis,
): ApiHealthAiRecord {
  const existing = getAiTaskById(taskId);

  if (!existing) {
    throw new Error("AI task record not found.");
  }

  if (existing.status !== "pending") {
    return existing;
  }

  const record: ApiHealthAiRecord = {
    ...existing,
    status: "completed",
    diagnosis,
    error: undefined,
    updatedAt: Date.now(),
  };

  store.set(existing.key, record);

  return record;
}

export function updateAiTaskStatus(
  taskId: string,
  status: "failed" | "timed_out",
  error?: string,
): ApiHealthAiRecord | undefined {
  const existing = getAiTaskById(taskId);

  if (!existing || existing.status !== "pending") {
    return existing;
  }

  const record: ApiHealthAiRecord = {
    ...existing,
    status,
    error,
    updatedAt: Date.now(),
  };

  store.set(existing.key, record);

  return record;
}

export function getAllAiDiagnoses(): ApiHealthAiRecord[] {
  return Array.from(store.values());
}

export function clearAiStore(): void {
  store.clear();
}
