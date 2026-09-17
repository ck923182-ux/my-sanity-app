
import { NextResponse } from "next/server"

import { getRequestLogs } from "@/agent/store"
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer"

import { createApiHealthTask } from "@/agent/ai/api-health-agent"

import {
  getAiDiagnosis,
  saveAiTask,
} from "@/agent/ai-store"

import type { ApiStats } from "@/agent/types"

export async function GET() {
  try {
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
    // Find problematic API
    // --------------------------------

    const problematicApi = stats.find(
      (api) =>
        api.health === "warning" ||
        api.health === "critical"
    )

    if (!problematicApi) {
      return NextResponse.json({
        success: true,
        message: "No warning or critical API found",
        diagnosis: null,
      })
    }

    // --------------------------------
    // Convert analyzer result to ApiStats
    // --------------------------------

    const apiStats: ApiStats = {
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

    // --------------------------------
    // Check for existing AI diagnosis
    // --------------------------------

    const existing = getAiDiagnosis(apiStats)

    // Existing diagnosis
    if (existing?.diagnosis) {
      return NextResponse.json({
        success: true,
        message: "Existing AI diagnosis returned",
        status: "completed",
        taskId: existing.taskId,
        api: problematicApi,
        diagnosis: existing.diagnosis,
      })
    }

    // Existing AI task is still running
    if (existing?.taskId) {
      return NextResponse.json({
        success: true,
        message: "Existing AI task is still running",
        status: "running",
        taskId: existing.taskId,
        api: problematicApi,
        diagnosis: null,
      })
    }

    // --------------------------------
    // No existing task → create one
    // --------------------------------

    const { taskId } = await createApiHealthTask(
      apiStats
    )

    saveAiTask(
      apiStats,
      taskId
    )

    return NextResponse.json({
      success: true,
      message: "API health analysis task created",
      status: "running",
      taskId,
      api: problematicApi,
      diagnosis: null,
    })
  } catch (error) {
    console.error("Health AI error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create health AI task",
      },
      { status: 500 }
    )
  }
}
