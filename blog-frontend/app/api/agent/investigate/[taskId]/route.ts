import { NextResponse } from "next/server"

import {
  getSourceAnalysisDiagnosis,
} from "@/agent/ai/source-analysis-agent"

type RouteContext = {
  params: Promise<{
    taskId: string
  }>
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { taskId } =
      await context.params

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          message: "taskId is required.",
        },
        {
          status: 400,
        }
      )
    }

    const diagnosis =
      await getSourceAnalysisDiagnosis(
        taskId
      )

    if (!diagnosis) {
      return NextResponse.json({
        success: true,
        taskId,
        status: "processing",
        ai: null,
      })
    }

    return NextResponse.json({
      success: true,
      taskId,
      status: "completed",
      ai: diagnosis,
    })
  } catch (error) {
    console.error(
      "Investigation polling error:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve investigation.",
      },
      {
        status: 500,
      }
    )
  }
}