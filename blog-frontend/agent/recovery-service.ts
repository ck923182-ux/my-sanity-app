import {
  getIssues,
  resolveIssueForInvestigation,
} from "@/agent/issue-store";

import { getInvestigationById } from "@/agent/investigation-store";
import { resolveApiRoute } from "@/agent/runtime/route-matcher";
import { verifyApiRecovery } from "@/agent/recovery-verifier";

export function checkApiRecovery(apiPath: string): void {
  const normalizedPath = resolveApiRoute(apiPath) ?? apiPath;

  // Agent endpoints must not trigger recovery checks.
  if (normalizedPath.startsWith("/api/agent")) return;

  const investigatingIssues = getIssues().filter((issue) => {
    const issuePath = resolveApiRoute(issue.apiPath) ?? issue.apiPath;

    return (
      issuePath === normalizedPath &&
      issue.status === "investigating" &&
      Boolean(issue.latestInvestigationId)
    );
  });

  for (const issue of investigatingIssues) {
    const investigationId = issue.latestInvestigationId;
    if (!investigationId) continue;

    const investigation = getInvestigationById(investigationId);

    if (!investigation) {
      console.warn("RECOVERY CHECK SKIPPED:", {
        issueId: issue.id,
        investigationId,
        reason: "Investigation record not found.",
      });
      continue;
    }

    // Only a completed diagnosis can enter automatic recovery.
    if (investigation.status !== "completed") {
      continue;
    }

    const result = verifyApiRecovery(
      normalizedPath,
      investigationId,
      investigation.createdAt,
    );

    console.log("API RECOVERY CHECK:", {
      issueId: issue.id,
      investigationId,
      apiPath: normalizedPath,
      ...result,
    });

    if (!result.recovered) continue;

    // Re-read the issue before resolving it. A newer investigation
    // or another lifecycle action may have changed its state.
    const resolvedIssue = resolveIssueForInvestigation(
  issue.id,
  investigationId,
);

    if (resolvedIssue) {
      console.log("API ISSUE AUTOMATICALLY RESOLVED:", {
        issueId: resolvedIssue.id,
        apiPath: normalizedPath,
        investigationId,
        averageDuration: result.averageDuration,
        totalRequests: result.totalRequests,
      });
    }
  }
}
