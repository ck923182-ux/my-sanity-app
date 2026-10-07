
import {
  createSourceAnalysisTask,
} from "@/agent/ai/source-analysis-agent"

import {
  addInvestigation,
} from "@/agent/investigation-store"

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
  requestUrl: string
) {
  /*
   * Step 1:
   * Run source analysis.
   */

  const sourceAnalysisUrl =
    new URL(
      "/api/agent/source-analysis",
      requestUrl
    )

  sourceAnalysisUrl.searchParams.set(
    "path",
    apiPath
  )

  const sourceAnalysisResponse =
    await fetch(
      sourceAnalysisUrl.toString(),
      {
        method: "GET",
        cache: "no-store",
      }
    )

  const sourceAnalysis =
    (await sourceAnalysisResponse.json()) as SourceAnalysisResponse

  if (
    !sourceAnalysisResponse.ok ||
    !sourceAnalysis.success
  ) {
    throw new Error(
      "Source analysis failed."
    )
  }

  /*
   * Step 2:
   * Make sure the source file exists.
   */

  if (
    !sourceAnalysis.found
  ) {
    throw new Error(
      `Source file not found for ${apiPath}.`
    )
  }

  /*
   * Step 3:
   * Send source evidence to Manus AI.
   */

  const aiTask =
    await createSourceAnalysisTask({
      apiPath,

      runtime:
        sourceAnalysis.runtime
          ? {
              duration:
                sourceAnalysis
                  .runtime
                  .duration,

              status:
                sourceAnalysis
                  .runtime
                  .status,
            }
          : null,

      bottleneck:
        sourceAnalysis
          .bottleneck ??
        null,

      rootCause:
        sourceAnalysis
          .rootCause ??
        null,

      developerRecommendation:
        sourceAnalysis
          .developerRecommendation ??
        null,

      sourceContext:
        sourceAnalysis
          .sourceContext ??
        null,
    })

  /*
   * Step 4:
   * Create investigation ID.
   */

  const investigationId =
    crypto.randomUUID()

  /*
   * Step 5:
   * Save investigation.
   */

  addInvestigation({
    id: investigationId,

    apiPath,

    createdAt:
      Date.now(),

    status:
      "processing",

    taskId:
      aiTask.taskId,

    sourceAnalysis: {
      filePath:
        sourceAnalysis
          .filePath,

      runtime:
        sourceAnalysis
          .runtime ?? null,

      bottleneck:
        sourceAnalysis
          .bottleneck ?? null,

      rootCause:
        sourceAnalysis
          .rootCause ?? null,

      developerRecommendation:
        sourceAnalysis
          .developerRecommendation ??
        null,

      sourceContext:
        sourceAnalysis
          .sourceContext ?? null,
    },

    ai: null,
  })

  return {
    investigationId,

    apiPath,

    taskId:
      aiTask.taskId,

    sourceAnalysis,
  }
}
