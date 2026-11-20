
import { NextResponse } from "next/server";
import { getRequestLogs } from "@/agent/store";
import { authorizeAdminApi } from "@/auth/guards";

export async function GET() {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

  try {
    const logs = getRequestLogs();

    return NextResponse.json({
      total: logs.length,
      logs,
    });
  } catch (error) {
    console.error("AGENT LOGS API FAILED:", {
      errorName:
        error instanceof Error
          ? error.name.slice(0, 100)
          : "UnknownError",
      message: "Unable to retrieve API request logs.",
    });

    return NextResponse.json(
      {
        error: "Unable to retrieve API request logs.",
      },
      { status: 500 },
    );
  }
}
