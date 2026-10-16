
import {
  createSourceAnalysisTask,
} from "@/agent/ai/source-analysis-agent"

import {
  addInvestigation,
} from "@/agent/investigation-store"

import {
  upsertIssue,
  updateIssueStatusForInvestigation,
} from "@/agent/issue-store"

type SourceAnalysisResponse = {
  success: boolean
  found: boolean
  apiPath?: string
  filePath?: string
  operations?: unknown[]

  runtime?: {
    duration: number
    status: number
    timestamp?: number
    operations?: unknown[]
  } | null

  bottleneck?: {
    name: string
    duration: number
    percentage: number
  } | null

  rootCause?: {
    likelyCause: string
    explanation: string
    duration: number
    bottleneckDuration: number
    sourceLines: number[]
  } | null

  developerRecommendation?: {
    priority: "high" | "medium" | "low"
    title: string
    recommendation: string
    reason: string
    sourceLines: number[]
  } | null

  sourceContext?: {
    startLine: number
    endLine: number
    code: string
  } | null
}

export async function createInvestigation(
  apiPath: string,
  requestUrl: string,
) {
  const sourceAnalysisUrl = new URL(
    "/api/agent/source-analysis",
    requestUrl,
  )

  sourceAnalysisUrl.searchParams.set("path", apiPath)

  const sourceAnalysisResponse = await fetch(
    sourceAnalysisUrl.toString(),
    {
      method: "GET",
      cache: "no-store",
    },
  )

  const sourceAnalysis =
    (await sourceAnalysisResponse.json()) as SourceAnalysisResponse

  if (!sourceAnalysisResponse.ok || !sourceAnalysis.success) {
    throw new Error("Source analysis failed.")
  }

  if (!sourceAnalysis.found) {
    throw new Error(`Source file not found for ${apiPath}.`)
  }

  // Create the existing Manus task. No additional task is created.
  const aiTask = await createSourceAnalysisTask({
    apiPath,

    runtime: sourceAnalysis.runtime
      ? {
          duration: sourceAnalysis.runtime.duration,
          status: sourceAnalysis.runtime.status,
        }
      : null,

    bottleneck: sourceAnalysis.bottleneck ?? null,
    rootCause: sourceAnalysis.rootCause ?? null,

    developerRecommendation:
      sourceAnalysis.developerRecommendation ?? null,

    sourceContext: sourceAnalysis.sourceContext ?? null,
  })

  const investigationId = crypto.randomUUID()

  addInvestigation({
    id: investigationId,
    apiPath,
    createdAt: Date.now(),
    status: "processing",
    taskId: aiTask.taskId,

    sourceAnalysis: {
      filePath: sourceAnalysis.filePath,
      runtime: sourceAnalysis.runtime ?? null,
      bottleneck: sourceAnalysis.bottleneck ?? null,
      rootCause: sourceAnalysis.rootCause ?? null,

      developerRecommendation:
        sourceAnalysis.developerRecommendation ?? null,

      sourceContext: sourceAnalysis.sourceContext ?? null,
    },

    ai: null,
  })

  const issue = upsertIssue({
    apiPath,
    investigationId,

    priority:
      sourceAnalysis.developerRecommendation?.priority ?? "medium",

    bottleneck: sourceAnalysis.bottleneck ?? null,
    rootCause: sourceAnalysis.rootCause ?? null,

    recommendation: sourceAnalysis.developerRecommendation
      ? {
          title: sourceAnalysis.developerRecommendation.title,
          recommendation:
            sourceAnalysis.developerRecommendation.recommendation,
          reason: sourceAnalysis.developerRecommendation.reason,
          sourceLines:
            sourceAnalysis.developerRecommendation.sourceLines,
        }
      : null,
  })

  // Mark the linked issue as investigating.

  // Mark the linked issue as investigating.
  const updatedIssue = updateIssueStatusForInvestigation(
    investigationId,
    "investigating",
  );

  if (!updatedIssue) {
    console.error("ISSUE LIFECYCLE UPDATE FAILED:", {
      issueId: issue.id,
      investigationId,
      apiPath,
    });
  }

  console.log("ISSUE LIFECYCLE UPDATED:", {
    issueId: updatedIssue?.id ?? issue.id,
    investigationId,
    apiPath,
    status: updatedIssue?.status ?? issue.status,
    statusUpdateSucceeded: updatedIssue !== null,
  });

  return {
    investigationId,
    apiPath,
    taskId: aiTask.taskId,
    sourceAnalysis,
    issueId: updatedIssue?.id ?? issue.id,
  };

}
