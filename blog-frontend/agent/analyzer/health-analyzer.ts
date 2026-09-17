
import { getRequestLogs } from "@/agent/store"

export type HealthStatus = "healthy" | "warning" | "critical"

export interface HealthIssue {
  type: string
  message: string
  severity: "low" | "medium" | "high"
}

export interface ApiHealthResult {
  path: string
  method: string

  health: HealthStatus

  totalCalls: number
  successCalls: number
  errorCalls: number

  averageDuration: number
  maxDuration: number

  errorRate: number
  duplicateCalls: number

  issues: HealthIssue[]
}

export function analyzeApiHealth(
  path: string,
  method?: string
): ApiHealthResult | null {
  const logs = getRequestLogs().filter((log) => {
    if (log.path !== path) {
      return false
    }

    if (method && log.method !== method) {
      return false
    }

    return true
  })

  if (logs.length === 0) {
    return null
  }

  const totalCalls = logs.length

  const successCalls = logs.filter(
    (log) => log.status >= 200 && log.status < 400
  ).length

  const errorCalls = logs.filter(
    (log) => log.status >= 400
  ).length

  const durations = logs.map((log) => log.duration)

  const averageDuration =
    durations.reduce((sum, duration) => sum + duration, 0) /
    durations.length

  const maxDuration = Math.max(...durations)

  const errorRate = (errorCalls / totalCalls) * 100

  // --------------------------------
  // True duplicate request analysis
  // --------------------------------
  //
  // The API monitor is responsible for deciding
  // whether a request is an actual duplicate.
  //
  // The analyzer only counts those decisions.
  //
  const duplicateCalls = logs.filter(
    (log) => log.isDuplicate === true
  ).length

  const issues: HealthIssue[] = []

  // -------------------------
  // Error rate analysis
  // -------------------------

  if (errorRate >= 50) {
    issues.push({
      type: "high-error-rate",
      message: `API error rate is ${errorRate.toFixed(1)}%.`,
      severity: "high",
    })
  } else if (errorRate >= 20) {
    issues.push({
      type: "elevated-error-rate",
      message: `API error rate is ${errorRate.toFixed(1)}%.`,
      severity: "medium",
    })
  }

  // -------------------------
  // Response time analysis
  // -------------------------

  if (averageDuration >= 2000) {
    issues.push({
      type: "very-slow-api",
      message: `Average response time is ${Math.round(
        averageDuration
      )}ms.`,
      severity: "high",
    })
  } else if (averageDuration >= 1000) {
    issues.push({
      type: "slow-api",
      message: `Average response time is ${Math.round(
        averageDuration
      )}ms.`,
      severity: "medium",
    })
  }

  // -------------------------
  // Duplicate request analysis
  // -------------------------

  if (duplicateCalls > 0) {
    issues.push({
      type: "duplicate-requests",
      message: `${duplicateCalls} duplicate request(s) detected.`,
      severity: "low",
    })
  }

  // -------------------------
  // Determine overall health
  // -------------------------

  let health: HealthStatus = "healthy"

  if (
    issues.some(
      (issue) => issue.severity === "high"
    )
  ) {
    health = "critical"
  } else if (issues.length > 0) {
    health = "warning"
  }

  return {
    path,
    method: method ?? logs[0].method,

    health,

    totalCalls,
    successCalls,
    errorCalls,

    averageDuration: Math.round(averageDuration),
    maxDuration: Math.round(maxDuration),

    errorRate: Number(errorRate.toFixed(1)),
    duplicateCalls,

    issues,
  }
}
