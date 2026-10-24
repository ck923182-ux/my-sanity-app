
import {
  getInvestigations,
} from "@/agent/investigation-store";

import {
  analyzeRecentApiHealth,
  type ApiHealthResult,
} from "@/agent/analyzer/health-analyzer";

import {
  resolveApiRoute,
} from "@/agent/runtime/route-matcher";

import {
  createInvestigation,
} from "@/agent/investigation-service";

import { getRequestLogs } from "@/agent/store";
import { getIssues } from "@/agent/issue-store";

import {
  evaluateAutomaticInvestigation,
  type AutomaticInvestigationDecision,
} from "@/agent/automatic-investigation-policy";

import {
  runAutomaticInvestigation,
} from "@/agent/automatic-investigation-runner";

export type { AutomaticInvestigationDecision } from
  "@/agent/automatic-investigation-policy";

const COOLDOWN_MS = 10 * 60 * 1000;
const MIN_REQUESTS = 3;

export function shouldAutomaticallyInvestigate(
  health: ApiHealthResult,
): AutomaticInvestigationDecision {
  const normalizedPath =
    resolveApiRoute(health.path) ?? health.path;

  // Excluded routes and insufficient traffic need no store reads.
  if (
    normalizedPath.startsWith("/api/agent") ||
    health.totalCalls < MIN_REQUESTS
  ) {
    return evaluateAutomaticInvestigation(health);
  }

  const activeIssue = getIssues().some((issue) => {
    const issuePath =
      resolveApiRoute(issue.apiPath) ?? issue.apiPath;

    return (
      issuePath === normalizedPath &&
      issue.status === "investigating"
    );
  });

  const now = Date.now();

  const recentInvestigation = getInvestigations().some(
    (investigation) => {
      const investigationPath =
        resolveApiRoute(investigation.apiPath) ??
        investigation.apiPath;

      const age = now - investigation.createdAt;

      return (
        investigationPath === normalizedPath &&
        age >= 0 &&
        age < COOLDOWN_MS
      );
    },
  );

  return evaluateAutomaticInvestigation(health, {
    hasActiveIssue: activeIssue,
    hasRecentInvestigation: recentInvestigation,
  });
}

export async function triggerAutomaticInvestigation(
  apiPath: string,
  requestUrl: string,
): Promise<void> {
  const normalizedPath =
    resolveApiRoute(apiPath) ?? apiPath;

  // Never automatically investigate the agent's own APIs.
  if (normalizedPath.startsWith("/api/agent")) {
    return;
  }

  const matchingLogs = getRequestLogs()
    .filter(
      (log) =>
        (resolveApiRoute(log.path) ?? log.path) ===
        normalizedPath,
    )
    .sort((a, b) => b.timestamp - a.timestamp);

  const latestMatchingLog = matchingLogs[0];

  // Preserve the existing authentication-failure safeguard.
  if (
    latestMatchingLog &&
    (latestMatchingLog.status === 401 ||
      latestMatchingLog.status === 403)
  ) {
    console.log("AUTOMATIC INVESTIGATION SKIPPED:", {
      apiPath: normalizedPath,
      reason: "Latest request failed authentication.",
    });

    return;
  }

  const health = analyzeRecentApiHealth(normalizedPath);

  if (!health) {
    return;
  }

  try {
    const result = await runAutomaticInvestigation(
      normalizedPath,
      {
        getHealth: () => health,

        decide: shouldAutomaticallyInvestigate,

        startInvestigation: async (path) => {
          console.log("AUTOMATIC INVESTIGATION STARTED:", {
            apiPath: path,
            health: health.health,
          });

          return createInvestigation(path, requestUrl);
        },
      },
    );

    if (result.status === "skipped") {
      console.log("AUTOMATIC INVESTIGATION SKIPPED:", {
        apiPath: normalizedPath,
        reason: result.reason,
      });

      return;
    }

    console.log("AUTOMATIC INVESTIGATION CREATED:", {
      apiPath: normalizedPath,
      investigationId: result.investigation.investigationId,
      taskId: result.investigation.taskId,
    });
  } catch (error) {
    console.error("AUTOMATIC INVESTIGATION FAILED:", {
      apiPath: normalizedPath,
      error,
    });
  }
}
