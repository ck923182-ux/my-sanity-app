
import {
  getInvestigations,
} from "@/agent/investigation-store"

import {
  analyzeApiHealth,
  type ApiHealthResult,
} from "@/agent/analyzer/health-analyzer"

import {
  resolveApiRoute,
} from "@/agent/runtime/route-matcher"

import {
  createInvestigation,
} from "@/agent/investigation-service"

import { getRequestLogs } from "@/agent/store"

export type AutomaticInvestigationDecision = {
  shouldInvestigate: boolean
  reason: string
}

const COOLDOWN_MS = 10 * 60 * 1000
const MIN_REQUESTS = 3
const MIN_SERVER_ERRORS = 2
const SERVER_ERROR_RATE_THRESHOLD = 50

export function shouldAutomaticallyInvestigate(
  health: ApiHealthResult
): AutomaticInvestigationDecision {
  if (health.path.startsWith("/api/agent")) {
    return {
      shouldInvestigate: false,
      reason: "Agent API is excluded from automatic investigation.",
    }
  }

  if (health.totalCalls < MIN_REQUESTS) {
    return {
      shouldInvestigate: false,
      reason: `Waiting for at least ${MIN_REQUESTS} requests before investigating.`,
    }
  }

  const investigations = getInvestigations()
  const now = Date.now()

  const recentInvestigation = investigations.find(
    (investigation) =>
      (resolveApiRoute(investigation.apiPath) ??
        investigation.apiPath) === health.path &&
      now - investigation.createdAt < COOLDOWN_MS
  )

  if (recentInvestigation) {
    return {
      shouldInvestigate: false,
      reason: "A recent investigation already exists for this API.",
    }
  }

  const hasRecurringServerErrors =
    health.serverErrorCalls >= MIN_SERVER_ERRORS &&
    health.errorRate >= SERVER_ERROR_RATE_THRESHOLD

  const hasSustainedLatency =
    health.averageDuration >= 2000

  if (hasRecurringServerErrors) {
    return {
      shouldInvestigate: true,
      reason: `Recurring server errors detected: ${health.serverErrorCalls} server errors with a ${health.errorRate}% server-error rate.`,
    }
  }

  if (hasSustainedLatency) {
    return {
      shouldInvestigate: true,
      reason: `Sustained high response time detected: ${health.averageDuration}ms average across ${health.totalCalls} requests.`,
    }
  }

  return {
    shouldInvestigate: false,
    reason: "Insufficient evidence of recurring server errors or sustained high latency.",
  }
}

export async function triggerAutomaticInvestigation(
  apiPath: string,
  requestUrl: string
): Promise<void> {
  const normalizedPath = resolveApiRoute(apiPath) ?? apiPath

  if (normalizedPath.startsWith("/api/agent")) {
    return
  }

  const matchingLogs = getRequestLogs()
    .filter(
      (log) =>
        (resolveApiRoute(log.path) ?? log.path) === normalizedPath
    )
    .sort((a, b) => b.timestamp - a.timestamp)

  const latestMatchingLog = matchingLogs[0]

  if (
    latestMatchingLog &&
    (latestMatchingLog.status === 401 ||
      latestMatchingLog.status === 403)
  ) {
    console.log("AUTOMATIC INVESTIGATION SKIPPED:", {
      apiPath: normalizedPath,
      reason: "Latest request failed authentication.",
    })

    return
  }

  const health = analyzeApiHealth(normalizedPath)

  if (!health) {
    return
  }

  const decision = shouldAutomaticallyInvestigate(health)

  if (!decision.shouldInvestigate) {
    console.log("AUTOMATIC INVESTIGATION SKIPPED:", {
      apiPath: normalizedPath,
      reason: decision.reason,
    })

    return
  }

  try {
    console.log("AUTOMATIC INVESTIGATION STARTED:", {
      apiPath: normalizedPath,
      health: health.health,
      reason: decision.reason,
    })

    const investigation = await createInvestigation(
      normalizedPath,
      requestUrl
    )

    console.log("AUTOMATIC INVESTIGATION CREATED:", {
      apiPath: normalizedPath,
      investigationId: investigation.investigationId,
      taskId: investigation.taskId,
    })
  } catch (error) {
    console.error("AUTOMATIC INVESTIGATION FAILED:", {
      apiPath: normalizedPath,
      error,
    })
  }
}
