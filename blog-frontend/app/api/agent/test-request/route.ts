
import { NextResponse } from "next/server";

import { withApiMonitoring } from "@/agent/runtime/api-monitor";

import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { consumeRateLimit } from "@/agent/runtime/rate-limiter";

export const GET = withApiMonitoring(async () => {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

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
    "test-request",
    20,
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

  return Response.json({
    success: true,
    message: "Test request successful",
  });
});
