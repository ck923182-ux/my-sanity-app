
import type { ApiRequestLog } from "@/agent/types";
import { getRequestLogs } from "@/agent/store";
import { resolveApiRoute } from "@/agent/runtime/route-matcher";
import { getIssueByInvestigationId } from "@/agent/issue-store";

const MIN_RECOVERY_REQUESTS = 3;
const MAX_RECOVERY_AVERAGE_DURATION_MS = 2000;

export type RecoveryVerificationResult = {
  recovered: boolean;
  reason: string;
  totalRequests: number;
  serverErrors: number;
  averageDuration: number | null;
};

export function evaluateRecoveryLogs(
  logs: ApiRequestLog[],
): RecoveryVerificationResult {
  // Exclude duplicate requests and examine the latest observations.
  const uniqueLogs = logs
    .filter((log) => log.isDuplicate !== true)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (uniqueLogs.length < MIN_RECOVERY_REQUESTS) {
    return {
      recovered: false,
      reason: `Waiting for at least ${MIN_RECOVERY_REQUESTS} unique requests after investigation started.`,
      totalRequests: uniqueLogs.length,
      serverErrors: uniqueLogs.filter(
        (log) => log.status >= 500 && log.status < 600,
      ).length,
      averageDuration: null,
    };
  }

  const recoveryWindow = uniqueLogs.slice(
    0,
    MIN_RECOVERY_REQUESTS,
  );

  const totalRequests = recoveryWindow.length;
  const serverErrors = recoveryWindow.filter(
    (log) => log.status >= 500 && log.status < 600,
  ).length;

  const averageDuration = Math.round(
    recoveryWindow.reduce(
      (sum, log) => sum + log.duration,
      0,
    ) / totalRequests,
  );

  if (serverErrors > 0) {
    return {
      recovered: false,
      reason: `${serverErrors} server error(s) occurred in the latest ${MIN_RECOVERY_REQUESTS} unique requests.`,
      totalRequests,
      serverErrors,
      averageDuration,
    };
  }

  if (averageDuration >= MAX_RECOVERY_AVERAGE_DURATION_MS) {
    return {
      recovered: false,
      reason: `Average response time is ${averageDuration}ms; recovery threshold is below ${MAX_RECOVERY_AVERAGE_DURATION_MS}ms.`,
      totalRequests,
      serverErrors,
      averageDuration,
    };
  }

  return {
    recovered: true,
    reason: `The latest ${MIN_RECOVERY_REQUESTS} unique requests meet the recovery thresholds.`,
    totalRequests,
    serverErrors,
    averageDuration,
  };
}

export function verifyApiRecovery(
  apiPath: string,
  investigationId: string,
  investigationStartedAt: number,
): RecoveryVerificationResult {
  const normalizedPath = resolveApiRoute(apiPath) ?? apiPath;
  const issue = getIssueByInvestigationId(investigationId);

  if (!issue) {
    return {
      recovered: false,
      reason: "No issue is linked to this investigation.",
      totalRequests: 0,
      serverErrors: 0,
      averageDuration: null,
    };
  }

  // Only use fresh requests recorded after this investigation started.
  const freshLogs = getRequestLogs().filter((log) => {
    const normalizedLogPath = resolveApiRoute(log.path) ?? log.path;

    return (
      normalizedLogPath === normalizedPath &&
      log.timestamp > investigationStartedAt &&
      log.isDuplicate !== true
    );
  });

  return evaluateRecoveryLogs(freshLogs);
}
