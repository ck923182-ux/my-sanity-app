
import { NextResponse } from "next/server";

import { getRequestLogs } from "@/agent/store";

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
      "logs",
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
});
