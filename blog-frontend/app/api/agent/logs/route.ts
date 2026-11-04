import { NextResponse } from "next/server"
import { getRequestLogs } from "@/agent/store"
import { authorizeAdminApi } from "@/auth/guards";

export async function GET() {
  const authError = await authorizeAdminApi();

  if (authError) return authError;
  const logs = getRequestLogs()

  return NextResponse.json({
    total: logs.length,
    logs,
  })
}