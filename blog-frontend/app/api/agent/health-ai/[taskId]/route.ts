
import { NextResponse } from "next/server";

import { ManusRequestError } from "@/agent/ai/manus-client";

import {
  ApiHealthTaskFailedError,
  getApiHealthDiagnosis,
} from "@/agent/ai/api-health-agent";

import {
  getAiTaskById,
  saveAiDiagnosis,
  updateAiTaskStatus,
} from "@/agent/ai-store";

import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";

export const GET = withApiMonitoring(async (
  request: Request,
  context?: unknown,
) => {
  const { params } = context as {
    params: Promise<{ taskId: string }>;
  };
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
      "health-ai-poll",
      30,
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

    const { taskId } = await params;

    if (
      typeof taskId !== "string" ||
      taskId.trim().length === 0 ||
      taskId.length > 200
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task ID.",
        },
        { status: 400 },
      );
    }

    const task = getAiTaskById(taskId);

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: "AI task not found.",
        },
        { status: 404 },
      );
    }

    if (task.status !== "pending") {
      return NextResponse.json({
        success: true,
        status: task.status,
        taskId,
        diagnosis: task.diagnosis ?? null,
        error: task.error ?? null,
      });
    }

    const MAX_AI_TASK_DURATION_MS = 10 * 60 * 1000;

    const taskAge = Date.now() - task.createdAt;

    if (taskAge >= MAX_AI_TASK_DURATION_MS) {
      updateAiTaskStatus(
        taskId,
        "timed_out",
        "API health diagnosis exceeded the maximum duration of 10 minutes.",
      );

      const updatedTask = getAiTaskById(taskId);

      return NextResponse.json({
        success: true,
        status: updatedTask?.status ?? "timed_out",
        taskId,
        diagnosis: null,
        message: "API health diagnosis timed out after 10 minutes.",
      });
    }

    const diagnosis = await getApiHealthDiagnosis(taskId);

    if (!diagnosis) {
      return NextResponse.json({
        success: true,
        status: "pending",
        taskId,
        diagnosis: null,
      });
    }

    const completedTask = saveAiDiagnosis(taskId, diagnosis);

    return NextResponse.json({
      success: true,
      status: completedTask.status,
      taskId,
      diagnosis: completedTask.diagnosis ?? null,
    });
  } catch (error) {
    if (error instanceof ApiHealthTaskFailedError) {
      const { taskId } = await params;

      updateAiTaskStatus(
        taskId,
        "failed",
        "Manus reported that the API health diagnosis failed.",
      );

      return NextResponse.json({
        success: false,
        status: "failed",
        taskId,
        message: "API health diagnosis failed.",
      });
    }

    if (error instanceof ManusRequestError) {
      const { taskId } = await params;

      const isTimeout = error.code === "TIMEOUT";

      return NextResponse.json(
        {
          success: false,
          status: "pending",
          taskId,
          message: isTimeout
            ? "Manus polling request timed out. Please retry."
            : "Unable to retrieve the Manus task. Please retry.",
        },
        {
          status: isTimeout ? 504 : 503,
        },
      );
    }

    console.error("Health AI diagnosis error:", {
      errorName:
        error instanceof Error ? error.name.slice(0, 100) : "UnknownError",
      message: "Health AI diagnosis could not be retrieved.",
    });

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve health AI diagnosis.",
      },
      { status: 500 },
    );
  }
});
