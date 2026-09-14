import type { ApiRequestLog } from "../types"

const DUPLICATE_WINDOW = 1000

export function detectDuplicateRequests(
  logs: ApiRequestLog[]
) {
  const duplicates: {
    method: string
    path: string
    count: number
    windowMs: number
  }[] = []

  const grouped = new Map<string, ApiRequestLog[]>()

  for (const log of logs) {
    const key = `${log.method}:${log.path}`

    const existing = grouped.get(key) ?? []

    existing.push(log)

    grouped.set(key, existing)
  }

  for (const [key, requests] of grouped) {
    const sorted = [...requests].sort(
      (a, b) => a.timestamp - b.timestamp
    )

    let maxCount = 1

    for (let i = 0; i < sorted.length; i++) {
      let count = 1

      for (let j = i + 1; j < sorted.length; j++) {
        const difference =
          sorted[j].timestamp - sorted[i].timestamp

        if (difference <= DUPLICATE_WINDOW) {
          count++
        } else {
          break
        }
      }

      maxCount = Math.max(maxCount, count)
    }

    if (maxCount > 1) {
      const [method, path] = key.split(":")

      duplicates.push({
        method,
        path,
        count: maxCount,
        windowMs: DUPLICATE_WINDOW,
      })
    }
  }

  return duplicates
}