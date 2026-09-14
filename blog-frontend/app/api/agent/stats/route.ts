import { NextResponse } from "next/server"
import { getRequestLogs } from "@/agent/store"
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer"

export async function GET() {
  const logs = getRequestLogs()

  const stats = analyzeApiHealth(logs)

  return NextResponse.json({
    totalRequests: logs.length,
    stats,
  })
}