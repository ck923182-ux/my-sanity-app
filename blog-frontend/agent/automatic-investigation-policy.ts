
import {
  resolveApiRoute,
} from "@/agent/runtime/route-matcher";

import type {
  ApiHealthResult,
} from "@/agent/analyzer/health-analyzer";

export type AutomaticInvestigationDecision = {
  shouldInvestigate: boolean;
  reason: string;
};

export type AutomaticInvestigationContext = {
  hasActiveIssue?: boolean;
  hasRecentInvestigation?: boolean;
};

const MIN_REQUESTS = 3;
const MIN_SERVER_ERRORS = 2;
const SERVER_ERROR_RATE_THRESHOLD = 50;
const SLOW_API_THRESHOLD_MS = 2000;

export function evaluateAutomaticInvestigation(
  health: ApiHealthResult,
  context: AutomaticInvestigationContext = {},
): AutomaticInvestigationDecision {
  const normalizedPath =
    resolveApiRoute(health.path) ?? health.path;

  if (normalizedPath.startsWith("/api/agent")) {
    return {
      shouldInvestigate: false,
      reason: "Agent API is excluded from automatic investigation.",
    };
  }

  if (health.totalCalls < MIN_REQUESTS) {
    return {
      shouldInvestigate: false,
      reason: `Waiting for at least ${MIN_REQUESTS} requests before investigating.`,
    };
  }

  if (context.hasActiveIssue) {
    return {
      shouldInvestigate: false,
      reason: "An issue for this API is already under investigation.",
    };
  }

  if (context.hasRecentInvestigation) {
    return {
      shouldInvestigate: false,
      reason: "A recent investigation already exists for this API.",
    };
  }

  const hasRecurringServerErrors =
    health.serverErrorCalls >= MIN_SERVER_ERRORS &&
    health.errorRate >= SERVER_ERROR_RATE_THRESHOLD;

  const hasSustainedLatency =
    health.averageDuration >= SLOW_API_THRESHOLD_MS;

  if (hasRecurringServerErrors) {
    return {
      shouldInvestigate: true,
      reason: `Recurring server errors detected: ${health.serverErrorCalls} server errors with a ${health.errorRate}% server-error rate.`,
    };
  }

  if (hasSustainedLatency) {
    return {
      shouldInvestigate: true,
      reason: `Sustained high response time detected: ${health.averageDuration}ms average across ${health.totalCalls} requests.`,
    };
  }

  return {
    shouldInvestigate: false,
    reason:
      "Insufficient evidence of recurring server errors or sustained high latency.",
  };
}
