// import { NextResponse } from "next/server"

// import { getRequestLogs } from "@/agent/store"
// import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer"
// import {
//   createApiHealthTask,
//   getApiHealthDiagnosis,
// } from "@/agent/ai/api-health-agent"

// export async function GET() {
//   try {
//     const logs = getRequestLogs()

//     const stats = analyzeApiHealth(logs)

//     const problematicApi = stats.find(
//       (api) => api.health === "warning" || api.health === "critical"
//     )

//     if (!problematicApi) {
//       return NextResponse.json({
//         success: true,
//         message: "No warning or critical API found",
//         diagnosis: null,
//       })
//     }

//     const { taskId } = await createApiHealthTask(problematicApi)

//     return NextResponse.json({
//       success: true,
//       message: "API health analysis task created",
//       taskId,
//       api: problematicApi,
//     })
//   } catch (error) {
//     console.error("Health AI error:", error)

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to create health AI task",
//       },
//       { status: 500 }
//     )
//   }
// }
import { NextResponse } from "next/server"

import { getRequestLogs } from "@/agent/store"
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer"

import {
  createApiHealthTask,
} from "@/agent/ai/api-health-agent"

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

    // Check whether we already have an AI task/diagnosis
    const existing = getAiDiagnosis(problematicApi)

    if (existing) {
      return NextResponse.json({
        success: true,
        message: existing.diagnosis
          ? "Existing AI diagnosis returned"
          : "Existing AI task is still running",
        taskId: existing.taskId,
        status: existing.diagnosis
          ? "completed"
          : "running",
        api: problematicApi,
        diagnosis: existing.diagnosis ?? null,
      })
    }

    // Create a new Manus task
    const { taskId } = await createApiHealthTask(
      problematicApi
    )

    // Store the task
    saveAiTask(problematicApi, taskId)

    return NextResponse.json({
      success: true,
      message: "API health analysis task created",
      taskId,
      status: "running",
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