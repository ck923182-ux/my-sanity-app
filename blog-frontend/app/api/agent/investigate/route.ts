
import { NextResponse } from "next/server"

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

export async function POST(request: Request) {
  try {
    const body =
      await request.json()

    const apiPath =
      body?.path

    if (!apiPath) {
      return NextResponse.json(
        {
          success: false,
          message:
            "path is required.",
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Step 1:
     * Run source analysis for the requested API.
     */
    const sourceAnalysisUrl =
      new URL(
        "/api/agent/source-analysis",
        request.url
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
      return NextResponse.json(
        {
          success: false,
          stage:
            "source-analysis",
          message:
            "Source analysis failed.",
          details:
            sourceAnalysis,
        },
        {
          status:
            sourceAnalysisResponse.status ||
            500,
        }
      )
    }

    /*
     * Step 2:
     * Make sure the API source file was found.
     */
    if (
      !sourceAnalysis.found
    ) {
      return NextResponse.json(
        {
          success: false,
          stage:
            "source-analysis",
          message:
            `Source file not found for ${apiPath}.`,
          details:
            sourceAnalysis,
        },
        {
          status: 404,
        }
      )
    }

    /*
     * Step 3:
     * Send the source analysis evidence to Manus AI.
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
     * Create a unique investigation ID.
     */
    const investigationId =
      crypto.randomUUID()

    console.log(
      "ABOUT TO SAVE INVESTIGATION:",
      investigationId
    )

    /*
     * Step 5:
     * Save the investigation to the persistent
     * investigation history store.
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

    /*
     * Step 6:
     * Return the investigation details.
     */
    return NextResponse.json({
      success: true,

      investigationId,

      apiPath,

      sourceAnalysis: {
        filePath:
          sourceAnalysis
            .filePath,

        runtime:
          sourceAnalysis
            .runtime,

        bottleneck:
          sourceAnalysis
            .bottleneck,

        rootCause:
          sourceAnalysis
            .rootCause,

        developerRecommendation:
          sourceAnalysis
            .developerRecommendation,

        sourceContext:
          sourceAnalysis
            .sourceContext,
      },

      ai: {
        taskId:
          aiTask.taskId,

        status:
          "processing",
      },

      message:
        "API investigation started successfully.",
    })
  } catch (error) {
    console.error(
      "Investigation error:",
      error
    )

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to investigate API.",
      },
      {
        status: 500,
      }
    )
  }
}
