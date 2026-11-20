
import { NextResponse } from "next/server";

import { getRequestLogs } from "@/agent/store";
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer";
import { resolveApiRoute } from "@/agent/runtime/route-matcher";

import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";

export const GET = withApiMonitoring(async (_request: Request) => {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const rateLimit = consumeRateLimit(
      session.user.id,
      "stats",
      120,
      60_000,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

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
});
