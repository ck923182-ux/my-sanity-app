import type { ApiRequestLog } from "./types"

const MAX_LOGS = 5000

const globalForAgent = globalThis as unknown as {
  __agentLogs?: ApiRequestLog[]
}

if (!globalForAgent.__agentLogs) {
  globalForAgent.__agentLogs = []
}

export function addRequestLog(log: ApiRequestLog) {
  globalForAgent.__agentLogs!.push(log)

  if (globalForAgent.__agentLogs!.length > MAX_LOGS) {
    globalForAgent.__agentLogs!.shift()
  }
}

export function getRequestLogs() {
  return globalForAgent.__agentLogs ?? []
}

export function clearRequestLogs() {
  globalForAgent.__agentLogs = []
}