
import { NextResponse } from "next/server";

import { getRequestLogs } from "@/agent/store";
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer";

import { createApiHealthTask } from "@/agent/ai/api-health-agent";
import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { getAiDiagnosis, saveAiTask } from "@/agent/ai-store";
import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";

import type { ApiStats } from "@/agent/types";

export const GET = withApiMonitoring(async () => {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const rateLimit = consumeRateLimit(
      session.user.id,
      "health-ai",
      5,
      60_000,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    const logs = getRequestLogs();

    const apiKeys = Array.from(
      new Set(logs.map((log) => `${log.method}:${log.path}`)),
    );

    const stats = apiKeys
      .map((key) => {
        const separatorIndex = key.indexOf(":");

        const method = key.slice(0, separatorIndex);
        const path = key.slice(separatorIndex + 1);

        return analyzeApiHealth(path, method);
      })
      .filter(
        (result): result is NonNullable<typeof result> => result !== null,
      );

    const problematicApi = stats.find(
      (api) => api.health === "warning" || api.health === "critical",
    );

    if (!problematicApi) {
      return NextResponse.json({
        success: true,
        message: "No warning or critical API found",
        diagnosis: null,
      });
    }

    const apiStats: ApiStats = {
      path: problematicApi.path,
      method: problematicApi.method,
      health: problematicApi.health,
      totalCalls: problematicApi.totalCalls,
      successCalls: problematicApi.successCalls,
      errorCalls: problematicApi.errorCalls,
      averageDuration: problematicApi.averageDuration,
      maxDuration: problematicApi.maxDuration,
      errorRate: problematicApi.errorRate,
      duplicateCalls: problematicApi.duplicateCalls,
      issues: problematicApi.issues.map((issue) => issue.message),
    };

    const existing = getAiDiagnosis(apiStats);

    if (existing?.status === "completed" && existing.diagnosis) {
      return NextResponse.json({
        success: true,
        message: "Existing AI diagnosis returned",
        status: "completed",
        taskId: existing.taskId,
        api: problematicApi,
        diagnosis: existing.diagnosis,
      });
    }

    if (existing?.status === "pending") {
      return NextResponse.json({
        success: true,
        message: "Existing AI task is still running",
        status: "pending",
        taskId: existing.taskId,
        api: problematicApi,
        diagnosis: null,
      });
    }

    const { taskId } = await createApiHealthTask(apiStats);

    saveAiTask(apiStats, taskId);

    return NextResponse.json({
      success: true,
      message: "API health analysis task created",
      status: "running",
      taskId,
      api: problematicApi,
      diagnosis: null,
    });
  } catch (error) {
    console.error("Health AI error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create health AI task",
      },
      { status: 500 },
    );
  }
});
