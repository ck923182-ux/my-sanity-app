
import { NextResponse } from "next/server"

import { getApiHealthDiagnosis } from "@/agent/ai/api-health-agent"
import { getRequestLogs } from "@/agent/store"
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer"
import { saveAiDiagnosis } from "@/agent/ai-store"
import type { ApiStats } from "@/agent/types"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing taskId",
        },
        { status: 400 }
      )
    }

    const diagnosis = await getApiHealthDiagnosis(taskId)

    if (!diagnosis) {
      return NextResponse.json({
        success: true,
        status: "running",
        taskId,
        diagnosis: null,
      })
    }

    const logs = getRequestLogs()

    // --------------------------------
    // Analyze each API separately
    // --------------------------------

    const apiKeys = Array.from(
      new Set(
        logs.map(
          (log) => `${log.method}:${log.path}`
        )
      )
    )

    const stats = apiKeys
      .map((key) => {
        const separatorIndex = key.indexOf(":")

        const method = key.slice(0, separatorIndex)
        const path = key.slice(separatorIndex + 1)

        return analyzeApiHealth(path, method)
      })
      .filter(
        (result): result is NonNullable<typeof result> =>
          result !== null
      )

    // --------------------------------
    // Find a problematic API
    // --------------------------------

    const problematicApi = stats.find(
      (api) =>
        api.health === "warning" ||
        api.health === "critical"
    )

    if (problematicApi) {
    const aiStats: ApiStats = {
      path: problematicApi.path,
      method: problematicApi.method,
      health: problematicApi.health,

      totalCalls: problematicApi.totalCalls,
      successCalls: problematicApi.successCalls,
      errorCalls: problematicApi.errorCalls,

      averageDuration: problematicApi.averageDuration,
      maxDuration: problematicApi.maxDuration,

      errorRate: problematicApi.errorRate,
      duplicateCalls: problematicApi.duplicateCalls,

      issues: problematicApi.issues.map(
        (issue) => issue.message
      ),
    }

    saveAiDiagnosis(
      aiStats,
      diagnosis
    )
  }

    return NextResponse.json({
      success: true,
      status: "completed",
      taskId,
      diagnosis,
    })
  } catch (error) {
    console.error(
      "Health AI diagnosis error:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve health AI diagnosis",
      },
      { status: 500 }
    )
  }
}

