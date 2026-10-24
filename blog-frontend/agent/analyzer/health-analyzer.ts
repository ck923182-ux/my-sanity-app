import { getRequestLogs } from "@/agent/store";
import { resolveApiRoute } from "@/agent/runtime/route-matcher";
import type { ApiRequestLog } from "@/agent/types";
export type HealthStatus = "healthy" | "warning" | "critical";

export interface HealthIssue {
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export interface ApiHealthResult {
  path: string;
  method: string;
  health: HealthStatus;
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  serverErrorCalls: number;
  clientErrorCalls: number;
  averageDuration: number;
  maxDuration: number;
  errorRate: number;
  duplicateCalls: number;
  issues: HealthIssue[];
}

export function analyzeApiHealth(
  path: string,
  method?: string,
): ApiHealthResult | null {
  const normalizedPath = resolveApiRoute(path) ?? path;

  const logs = getRequestLogs().filter((log) => {
    const normalizedLogPath = resolveApiRoute(log.path) ?? log.path;

    if (normalizedLogPath !== normalizedPath) return false;
    if (method && log.method !== method) return false;

    return true;
  });

  if (logs.length === 0) return null;

  const totalCalls = logs.length;

  const successCalls = logs.filter(
    (log) => log.status >= 200 && log.status < 400,
  ).length;

  // Keep the full HTTP error count for dashboard visibility.
  const errorCalls = logs.filter((log) => log.status >= 400).length;

  const serverErrorCalls = logs.filter((log) => log.status >= 500).length;

  const clientErrorCalls = logs.filter(
    (log) => log.status >= 400 && log.status < 500,
  ).length;

  const durations = logs.map((log) => log.duration);

  const averageDuration =
    durations.reduce((sum, duration) => sum + duration, 0) / durations.length;

  const maxDuration = Math.max(...durations);

  // Use server failures for health severity so a single 401
  // does not automatically make the endpoint critical.
  const errorRate = (serverErrorCalls / totalCalls) * 100;

  const duplicateCalls = logs.filter((log) => log.isDuplicate === true).length;

  const issues: HealthIssue[] = [];

  if (errorRate >= 50) {
    issues.push({
      type: "high-server-error-rate",
      message: `API server error rate is ${errorRate.toFixed(1)}%.`,
      severity: "high",
    });
  } else if (errorRate >= 20) {
    issues.push({
      type: "elevated-server-error-rate",
      message: `API server error rate is ${errorRate.toFixed(1)}%.`,
      severity: "medium",
    });
  }

  if (clientErrorCalls > 0) {
    issues.push({
      type: "client-errors",
      message: `${clientErrorCalls} client error(s) (4xx) recorded. These may include expected authentication or validation responses.`,
      severity: "low",
    });
  }

  if (averageDuration >= 2000) {
    issues.push({
      type: "very-slow-api",
      message: `Average response time is ${Math.round(averageDuration)}ms.`,
      severity: "high",
    });
  } else if (averageDuration >= 1000) {
    issues.push({
      type: "slow-api",
      message: `Average response time is ${Math.round(averageDuration)}ms.`,
      severity: "medium",
    });
  }

  if (duplicateCalls > 0) {
    issues.push({
      type: "duplicate-requests",
      message: `${duplicateCalls} duplicate request(s) detected.`,
      severity: "low",
    });
  }

  let health: HealthStatus = "healthy";

  if (issues.some((issue) => issue.severity === "high")) {
    health = "critical";
  } else if (issues.some((issue) => issue.severity === "medium")) {
    health = "warning";
  }

  return {
    path: normalizedPath,
    method: method ?? logs[0].method,
    health,
    totalCalls,
    successCalls,
    errorCalls,
    serverErrorCalls,
    clientErrorCalls,
    averageDuration: Math.round(averageDuration),
    maxDuration: Math.round(maxDuration),
    errorRate: Number(errorRate.toFixed(1)),
    duplicateCalls,
    issues,
  };
}

const AUTOMATION_WINDOW_SIZE = 10;

export function analyzeRecentApiHealth(
  path: string,
  method?: string,
): ApiHealthResult | null {
  const normalizedPath = resolveApiRoute(path) ?? path;

  const logs = getRequestLogs()
    .filter((log) => {
      const normalizedLogPath =
        resolveApiRoute(log.path) ?? log.path;

      if (normalizedLogPath !== normalizedPath) return false;
      if (method && log.method !== method) return false;

      return log.isDuplicate !== true;
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, AUTOMATION_WINDOW_SIZE);

  if (logs.length === 0) return null;

  const totalCalls = logs.length;

  const successCalls = logs.filter(
    (log) => log.status >= 200 && log.status < 400,
  ).length;

  const errorCalls = logs.filter(
    (log) => log.status >= 400,
  ).length;

  const serverErrorCalls = logs.filter(
    (log) => log.status >= 500 && log.status < 600,
  ).length;

  const clientErrorCalls = logs.filter(
    (log) => log.status >= 400 && log.status < 500,
  ).length;

  const durations = logs.map((log) => log.duration);

  const averageDuration = Math.round(
    durations.reduce((sum, duration) => sum + duration, 0) /
      durations.length,
  );

  const maxDuration = Math.max(...durations);

  const errorRate = Number(
    ((serverErrorCalls / totalCalls) * 100).toFixed(1),
  );

  const issues: HealthIssue[] = [];

  if (errorRate >= 50) {
    issues.push({
      type: "high-server-error-rate",
      message: `API server error rate is ${errorRate}%.`,
      severity: "high",
    });
  } else if (errorRate >= 20) {
    issues.push({
      type: "elevated-server-error-rate",
      message: `API server error rate is ${errorRate}%.`,
      severity: "medium",
    });
  }

  if (averageDuration >= 2000) {
    issues.push({
      type: "very-slow-api",
      message: `Average response time is ${averageDuration}ms.`,
      severity: "high",
    });
  } else if (averageDuration >= 1000) {
    issues.push({
      type: "slow-api",
      message: `Average response time is ${averageDuration}ms.`,
      severity: "medium",
    });
  }

  let health: HealthStatus = "healthy";

  if (issues.some((issue) => issue.severity === "high")) {
    health = "critical";
  } else if (issues.some((issue) => issue.severity === "medium")) {
    health = "warning";
  }

  return {
    path: normalizedPath,
    method: method ?? logs[0].method,
    health,
    totalCalls,
    successCalls,
    errorCalls,
    serverErrorCalls,
    clientErrorCalls,
    averageDuration,
    maxDuration,
    errorRate,
    duplicateCalls: 0,
    issues,
  };
}
