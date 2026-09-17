import { NextResponse } from "next/server"
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const apiPath = searchParams.get("path")
    const method = searchParams.get("method") || undefined

    if (!apiPath) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required query parameter: path",
        },
        { status: 400 }
      )
    }

    const result = analyzeApiHealth(apiPath, method)

    if (!result) {
      return NextResponse.json({
        success: true,
        found: false,
        message: `No monitoring data found for ${apiPath}`,
      })
    }

    return NextResponse.json({
      success: true,
      found: true,
      analysis: result,
    })
  } catch (error) {
    console.error("API health analyzer error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to analyze API health",
      },
      { status: 500 }
    )
  }
}