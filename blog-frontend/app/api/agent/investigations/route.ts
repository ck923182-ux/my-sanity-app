
import { NextResponse } from "next/server";

import { getInvestigations } from "@/agent/investigation-store";

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
      "investigations",
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

    const investigations = getInvestigations();

    return NextResponse.json({
      success: true,
      total: investigations.length,
      investigations,
    });
  } catch (error) {
    console.error("Investigation history error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load investigation history.",
      },
      { status: 500 },
    );
  }
});
