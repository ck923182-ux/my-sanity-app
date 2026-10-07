
import {
  getInvestigations,
} from "@/agent/investigation-store"

import {
  analyzeApiHealth,
  type ApiHealthResult,
} from "@/agent/analyzer/health-analyzer"

import {
  createInvestigation,
} from "@/agent/investigation-service"

export type AutomaticInvestigationDecision = {
  shouldInvestigate: boolean
  reason: string
}

const COOLDOWN_MS =
  10 * 60 * 1000

export function shouldAutomaticallyInvestigate(
  health: ApiHealthResult
): AutomaticInvestigationDecision {
  // --------------------------------
  // Never investigate agent APIs
  // --------------------------------

  if (
    health.path.startsWith(
      "/api/agent"
    )
  ) {
    return {
      shouldInvestigate: false,
      reason:
        "Agent API is excluded from automatic investigation.",
    }
  }

  // --------------------------------
  // Only investigate unhealthy APIs
  // --------------------------------

  if (
    health.health === "healthy"
  ) {
    return {
      shouldInvestigate: false,
      reason:
        "API is healthy. No investigation required.",
    }
  }

  // --------------------------------
  // Check recent investigation
  // --------------------------------

  const investigations =
    getInvestigations()

  const now = Date.now()

  const recentInvestigation =
    investigations.find(
      (investigation) =>
        investigation.apiPath ===
          health.path &&
        now -
            investigation.createdAt <
          COOLDOWN_MS
    )

  if (recentInvestigation) {
    return {
      shouldInvestigate: false,
      reason:
        "A recent investigation already exists for this API.",
    }
  }

  // --------------------------------
  // API requires investigation
  // --------------------------------

  return {
    shouldInvestigate: true,
    reason:
      `API health is ${health.health}. Automatic investigation required.`,
  }
}

export async function triggerAutomaticInvestigation(
  apiPath: string,
  requestUrl: string
): Promise<void> {
  // --------------------------------
  // Never investigate agent APIs
  // --------------------------------

  if (
    apiPath.startsWith(
      "/api/agent"
    )
  ) {
    return
  }

  // --------------------------------
  // Analyze current API health
  // --------------------------------

  const health =
    analyzeApiHealth(apiPath)

  if (!health) {
    return
  }

  // --------------------------------
  // Decide whether investigation
  // is required
  // --------------------------------

  const decision =
    shouldAutomaticallyInvestigate(
      health
    )

  if (
    !decision.shouldInvestigate
  ) {
    console.log(
      "AUTOMATIC INVESTIGATION SKIPPED:",
      {
        apiPath,
        reason:
          decision.reason,
      }
    )

    return
  }

  // --------------------------------
  // Start investigation
  // --------------------------------

  try {
    console.log(
      "AUTOMATIC INVESTIGATION STARTED:",
      {
        apiPath,
        health:
          health.health,
        reason:
          decision.reason,
      }
    )

    const investigation =
      await createInvestigation(
        apiPath,
        requestUrl
      )

    console.log(
      "AUTOMATIC INVESTIGATION CREATED:",
      {
        apiPath,
        investigationId:
          investigation.investigationId,
        taskId:
          investigation.taskId,
      }
    )
  } catch (error) {
    console.error(
      "AUTOMATIC INVESTIGATION FAILED:",
      {
        apiPath,
        error,
      }
    )
  }
}
