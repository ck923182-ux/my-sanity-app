
import { NextResponse } from "next/server";

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

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { taskId } = await context.params;

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          message: "taskId is required.",
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

    // Prevent an older investigation from changing the lifecycle
    // of an issue managed by a newer investigation.
    const linkedIssue = getIssueByInvestigationId(
      investigation.id,
    );

    if (
      linkedIssue &&
      linkedIssue.latestInvestigationId !== investigation.id
    ) {
      console.warn("STALE INVESTIGATION POLL:", {
        taskId,
        investigationId: investigation.id,
        issueId: linkedIssue.id,
        latestInvestigationId:
          linkedIssue.latestInvestigationId,
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

    // Do not poll again after a terminal state has been recorded.
    if (
      investigation.status === "completed" &&
      investigation.ai
    ) {
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
        message:
          investigation.error ?? "Investigation failed.",
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

        // A failed diagnostic task does not mean the API
        // itself has recovered.
        updateIssueStatusForInvestigation(
          investigation.id,
          "open",
        );

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
          message: error.message,
        });
      }

      // Network, timeout, and Manus API errors do not prove
      // that the underlying task has failed.
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

    // Recheck before updating the investigation record because
    // a newer investigation might have started during the await.
    const latestLinkedIssue = getIssueByInvestigationId(
      investigation.id,
    );

    if (
      latestLinkedIssue &&
      latestLinkedIssue.latestInvestigationId !==
        investigation.id
    ) {
      console.warn("STALE INVESTIGATION RESULT DISCARDED:", {
        taskId,
        investigationId: investigation.id,
        issueId: latestLinkedIssue.id,
        latestInvestigationId:
          latestLinkedIssue.latestInvestigationId,
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

    const updatedInvestigation = updateInvestigation(
      investigation.id,
      {
        status: "completed",
        ai: diagnosis,
        error: undefined,
      },
    );

    if (!updatedInvestigation) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Investigation record could not be updated.",
        },
        { status: 500 },
      );
    }

    // Diagnosis completion is not API recovery.
    // Keep the issue investigating until runtime evidence
    // independently confirms that the API has recovered.
    updateIssueStatusForInvestigation(
      investigation.id,
      "investigating",
    );

    return NextResponse.json({
      success: true,
      taskId,
      status: "completed",
      ai: diagnosis,
    });
  } catch (error) {
    console.error("Investigation polling error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve investigation.",
      },
      { status: 500 },
    );
  }
}
