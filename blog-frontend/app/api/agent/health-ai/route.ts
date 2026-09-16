
import { NextResponse } from "next/server"

import { getRequestLogs } from "@/agent/store"
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer"

import { createApiHealthTask } from "@/agent/ai/api-health-agent"

import {
  getAiDiagnosis,
  saveAiTask,
} from "@/agent/ai-store"

export async function GET() {
  try {
    const logs = getRequestLogs()

    const stats = analyzeApiHealth(logs)

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

    const existing = getAiDiagnosis(problematicApi)

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

    // Existing Manus task is still running
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

    // No existing task → create one
    const { taskId } = await createApiHealthTask(
      problematicApi
    )

    saveAiTask(problematicApi, taskId)

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