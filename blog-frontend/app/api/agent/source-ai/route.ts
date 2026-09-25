import { NextResponse } from "next/server"

import {
  createSourceAnalysisTask,
} from "@/agent/ai/source-analysis-agent"

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json()

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Request body is required.",
        },
        {
          status: 400,
        }
      )
    }

    const {
      apiPath,
      runtime,
      bottleneck,
      rootCause,
      developerRecommendation,
      sourceContext,
    } = body

    if (!apiPath) {
      return NextResponse.json(
        {
          success: false,
          message:
            "apiPath is required.",
        },
        {
          status: 400,
        }
      )
    }

    const result =
      await createSourceAnalysisTask({
        apiPath,
        runtime:
          runtime ?? null,
        bottleneck:
          bottleneck ?? null,
        rootCause:
          rootCause ?? null,
        developerRecommendation:
          developerRecommendation ??
          null,
        sourceContext:
          sourceContext ?? null,
      })

    return NextResponse.json({
      success: true,

      taskId: result.taskId,

      apiPath,

      message:
        "Source analysis AI task created successfully.",
    })
  } catch (error) {
    console.error(
      "Source AI error:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create source analysis AI task.",
      },
      {
        status: 500,
      }
    )
  }
}