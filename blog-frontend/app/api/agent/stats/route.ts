import { NextResponse } from "next/server"

import { getRequestLogs } from "@/agent/store"
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer"

export async function GET() {
  const logs = getRequestLogs()

  // Get unique API method + path combinations
  const apiRoutes = Array.from(
    new Map(
      logs.map((log) => [
        `${log.method}:${log.path}`,
        {
          path: log.path,
          method: log.method,
        },
      ])
    ).values()
  ) 

  const stats = apiRoutes
    .map(({ path, method }) =>
      analyzeApiHealth(path, method)
    )
    .filter(Boolean)

  return NextResponse.json({
    totalRequests: logs.length,
    stats,
  })
}