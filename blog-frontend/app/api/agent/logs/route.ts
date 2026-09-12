import { NextResponse } from "next/server"
import { getRequestLogs } from "@/agent/store"

export async function GET() {
  const logs = getRequestLogs()

  return NextResponse.json({
    total: logs.length,
    logs,
  })
}