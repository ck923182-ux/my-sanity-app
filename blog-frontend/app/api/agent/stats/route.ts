
import { NextResponse } from "next/server";

import { getRequestLogs } from "@/agent/store";
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer";
import { resolveApiRoute } from "@/agent/runtime/route-matcher";
import { authorizeAdminApi } from "@/auth/guards";

export async function GET() {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

  try {
    const logs = getRequestLogs();

    // Group requests by their resolved Next.js route and HTTP method.
    const apiRoutes = Array.from(
      new Map(
        logs.map((log) => {
          const path = resolveApiRoute(log.path) ?? log.path;

          return [
            `${log.method}:${path}`,
            {
              path,
              method: log.method,
            },
          ] as const;
        }),
      ).values(),
    );

    const stats = apiRoutes
      .map(({ path, method }) => analyzeApiHealth(path, method))
      .filter((stat) => stat !== null);

    return NextResponse.json({
      totalRequests: logs.length,
      stats,
    });
  } catch (error) {
    console.error("AGENT STATS API FAILED:", {
      errorName:
        error instanceof Error
          ? error.name.slice(0, 100)
          : "UnknownError",
      message: "Unable to calculate API statistics.",
    });

    return NextResponse.json(
      {
        error: "Unable to calculate API statistics.",
      },
      { status: 500 },
    );
  }
}
