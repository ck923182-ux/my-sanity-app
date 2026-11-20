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
import { authorizeAdminApi } from "@/auth/guards";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

  try {
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
}
