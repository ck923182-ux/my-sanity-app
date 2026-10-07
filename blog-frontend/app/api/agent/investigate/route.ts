
import { NextResponse } from "next/server"

import {
  createInvestigation,
} from "@/agent/investigation-service"

export async function POST(
  request: Request
) {
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

    const result =
      await createInvestigation(
        apiPath,
        request.url
      )

    return NextResponse.json({
      success: true,

      investigationId:
        result.investigationId,

      apiPath:
        result.apiPath,

      sourceAnalysis: {
        filePath:
          result.sourceAnalysis
            .filePath,

        runtime:
          result.sourceAnalysis
            .runtime,

        bottleneck:
          result.sourceAnalysis
            .bottleneck,

        rootCause:
          result.sourceAnalysis
            .rootCause,

        developerRecommendation:
          result.sourceAnalysis
            .developerRecommendation,

        sourceContext:
          result.sourceAnalysis
            .sourceContext,
      },

      ai: {
        taskId:
          result.taskId,

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
