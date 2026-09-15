//     import { NextResponse } from "next/server"

// import { getApiHealthDiagnosis } from "@/agent/ai/api-health-agent"

// export async function GET(
//   request: Request,
//   { params }: { params: Promise<{ taskId: string }> }
// ) {
//   try {
//     const { taskId } = await params

//     if (!taskId) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Missing taskId",
//         },
//         { status: 400 }
//       )
//     }

//     const diagnosis = await getApiHealthDiagnosis(taskId)

//     if (!diagnosis) {
//       return NextResponse.json({
//         success: true,
//         status: "running",
//         diagnosis: null,
//       })
//     }

//     return NextResponse.json({
//       success: true,
//       status: "completed",
//       diagnosis,
//     })
//   } catch (error) {
//     console.error("Health AI diagnosis error:", error)

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to retrieve health AI diagnosis",
//       },
//       { status: 500 }
//     )
//   }
// }
import { NextResponse } from "next/server"

import { getApiHealthDiagnosis } from "@/agent/ai/api-health-agent"

import {
  getRequestLogs,
} from "@/agent/store"

import {
  analyzeApiHealth,
} from "@/agent/analyzer/health-analyzer"

import {
  saveAiDiagnosis,
} from "@/agent/ai-store"

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

    const diagnosis =
      await getApiHealthDiagnosis(taskId)

    if (!diagnosis) {
      return NextResponse.json({
        success: true,
        status: "running",
        diagnosis: null,
      })
    }

    const logs = getRequestLogs()

    const stats = analyzeApiHealth(logs)

    const problematicApi = stats.find(
      (api) =>
        api.health === "warning" ||
        api.health === "critical"
    )

    if (problematicApi) {
      saveAiDiagnosis(
        problematicApi,
        diagnosis
      )
    }

    return NextResponse.json({
      success: true,
      status: "completed",
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
        message:
          "Failed to retrieve health AI diagnosis",
      },
      { status: 500 }
    )
  }
}