import type { ApiRequestLog, ApiStats } from "../types"
import { detectDuplicateRequests } from "../runtime/duplicate-detector"

export function analyzeApiHealth(
  logs: ApiRequestLog[]
): ApiStats[] {
  const groups = new Map<string, ApiRequestLog[]>()

  for (const log of logs) {
    const key = `${log.method}:${log.path}`

    const existing = groups.get(key) ?? []

    existing.push(log)

    groups.set(key, existing)
  }

  const duplicates = detectDuplicateRequests(logs)

  const stats: ApiStats[] = []

  for (const [key, requests] of groups) {
    const [method, path] = key.split(":")

    const totalCalls = requests.length

    const successCalls = requests.filter(
      (request) =>
        request.status >= 200 &&
        request.status < 400
    ).length

    const errorCalls = requests.filter(
      (request) => request.status >= 400
    ).length

    const totalDuration = requests.reduce(
      (total, request) =>
        total + request.duration,
      0
    )

    const averageDuration =
      totalCalls > 0
        ? Math.round(totalDuration / totalCalls)
        : 0

    const maxDuration =
      totalCalls > 0
        ? Math.max(
            ...requests.map(
              (request) => request.duration
            )
          )
        : 0

    const errorRate =
      totalCalls > 0
        ? Math.round(
            (errorCalls / totalCalls) * 100
          )
        : 0

    const duplicate = duplicates.find(
      (item) =>
        item.method === method &&
        item.path === path
    )

    const duplicateCalls =
      duplicate?.count ?? 0

    const issues: string[] = []

    // Error detection
    if (errorRate >= 50) {
      issues.push("High error rate")
    } else if (errorRate >= 20) {
      issues.push("Elevated error rate")
    }

    // Performance detection
    if (averageDuration >= 2000) {
      issues.push("Very slow API")
    } else if (averageDuration >= 1000) {
      issues.push("Slow API")
    }

    // Duplicate detection
    if (duplicateCalls >= 2) {
      issues.push("Possible duplicate requests")
    }

    let health: ApiStats["health"] = "healthy"

    if (
      errorRate >= 50 ||
      averageDuration >= 2000
    ) {
      health = "critical"
    } else if (
      errorRate >= 20 ||
      averageDuration >= 1000 ||
      duplicateCalls >= 2
    ) {
      health = "warning"
    }

    stats.push({
      path,
      method,
      totalCalls,
      successCalls,
      errorCalls,
      averageDuration,
      maxDuration,
      duplicateCalls,
      errorRate,
      health,
      issues,
    })
  }

  return stats
}