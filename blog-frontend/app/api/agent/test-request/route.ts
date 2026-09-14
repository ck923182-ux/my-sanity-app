import { NextResponse } from "next/server"
import { monitorApi } from "@/agent/runtime/api-monitor"

export async function GET(request: Request) {
  return monitorApi(request, async () => {
    return NextResponse.json({
      success: true,
      message: "Agent test request",
      timestamp: Date.now(),
    })
  })
}