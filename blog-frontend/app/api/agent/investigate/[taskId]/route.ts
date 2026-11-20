
import { NextResponse } from "next/server";

import { ManusRequestError } from "@/agent/ai/manus-client";

const MAX_INVESTIGATION_DURATION_MS = 10 * 60 * 1000;

import {
  getSourceAnalysisDiagnosis,
  SourceAnalysisTaskFailedError,
} from "@/agent/ai/source-analysis-agent";

import {
  getInvestigations,
  updateInvestigation,
} from "@/agent/investigation-store";

import {
  getIssueByInvestigationId,
  updateIssueStatusForInvestigation,
} from "@/agent/issue-store";

import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export const GET = withApiMonitoring(async (
  _request: Request,
  context?: unknown,
) => {
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
      "investigate-poll",
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

    const { params } = context as RouteContext;
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

    const investigation = getInvestigations().find(
      (item) => item.taskId === taskId,
    );

    if (!investigation) {
      return NextResponse.json(
        {
          success: false,
          message: "Investigation not found for this task.",
        },
        { status: 404 },
      );
    }

    const linkedIssue = getIssueByInvestigationId(investigation.id);

    if (linkedIssue && linkedIssue.latestInvestigationId !== investigation.id) {
      console.warn("STALE INVESTIGATION POLL:", {
        taskId,
        investigationId: investigation.id,
        issueId: linkedIssue.id,
        latestInvestigationId: linkedIssue.latestInvestigationId,
      });

      return NextResponse.json({
        success: true,
        taskId,
        status: investigation.status,
        stale: true,
        message:
          "A newer investigation exists. This task cannot change the current issue lifecycle.",
      });
    }

    if (investigation.status === "completed" && investigation.ai) {
      return NextResponse.json({
        success: true,
        taskId,
        status: "completed",
        ai: investigation.ai,
      });
    }

    if (investigation.status === "failed") {
      return NextResponse.json({
        success: true,
        taskId,
        status: "failed",
        ai: null,
        message: "AI investigation failed. Check the server logs for details.",
      });
    }

    const investigationAge = Date.now() - investigation.createdAt;

    if (investigationAge >= MAX_INVESTIGATION_DURATION_MS) {
      const timedOutInvestigation = updateInvestigation(
        investigation.id,
        {
          status: "failed",
          error: "Investigation exceeded the maximum duration of 10 minutes.",
        },
      );

      if (!timedOutInvestigation) {
        return NextResponse.json(
          {
            success: false,
            message: "Investigation timeout could not be recorded.",
          },
          { status: 500 },
        );
      }

      updateIssueStatusForInvestigation(investigation.id, "open");

      return NextResponse.json({
        success: true,
        taskId,
        status: "failed",
        ai: null,
        message: "Investigation timed out after 10 minutes.",
      });
    }

    let diagnosis;

    try {
      diagnosis = await getSourceAnalysisDiagnosis(taskId);
    } catch (error) {
      if (error instanceof SourceAnalysisTaskFailedError) {
        updateInvestigation(investigation.id, {
          status: "failed",
          error: error.message,
        });

        updateIssueStatusForInvestigation(investigation.id, "open");

        console.error("INVESTIGATION TASK FAILED:", {
          taskId,
          investigationId: investigation.id,
          error: error.message,
        });

        return NextResponse.json({
          success: true,
          taskId,
          status: "failed",
          ai: null,
          message:
            "AI investigation failed. Check the server logs for details.",
        });
      }

      throw error;
    }

    if (!diagnosis) {
      return NextResponse.json({
        success: true,
        taskId,
        status: "processing",
        ai: null,
      });
    }

    const latestLinkedIssue = getIssueByInvestigationId(investigation.id);

    if (
      latestLinkedIssue &&
      latestLinkedIssue.latestInvestigationId !== investigation.id
    ) {
      console.warn("STALE INVESTIGATION RESULT DISCARDED:", {
        taskId,
        investigationId: investigation.id,
        issueId: latestLinkedIssue.id,
        latestInvestigationId: latestLinkedIssue.latestInvestigationId,
      });

      return NextResponse.json({
        success: true,
        taskId,
        status: investigation.status,
        stale: true,
        message:
          "A newer investigation started while this task was being processed. Its result was discarded.",
      });
    }

    const updatedInvestigation = updateInvestigation(investigation.id, {
      status: "completed",
      ai: diagnosis,
      error: undefined,
    });

    if (!updatedInvestigation) {
      return NextResponse.json(
        {
          success: false,
          message: "Investigation record could not be updated.",
        },
        { status: 500 },
      );
    }

    updateIssueStatusForInvestigation(investigation.id, "investigating");

    return NextResponse.json({
      success: true,
      taskId,
      status: "completed",
      ai: diagnosis,
    });
  } catch (error) {
    if (error instanceof ManusRequestError) {
      const isTimeout = error.code === "TIMEOUT";

      return NextResponse.json(
        {
          success: false,
          message: isTimeout
            ? "Manus polling request timed out. Please retry."
            : "Unable to retrieve the Manus task. Please retry.",
        },
        { status: isTimeout ? 504 : 503 },
      );
    }

    console.error("Investigation polling error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve investigation.",
      },
      { status: 500 },
    );
  }
});
