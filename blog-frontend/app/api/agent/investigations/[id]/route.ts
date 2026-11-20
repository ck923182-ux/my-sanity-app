
import { NextResponse } from "next/server";

import { getInvestigationById } from "@/agent/investigation-store";

import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = withApiMonitoring(async (
  _request: Request,
  context?: unknown,
) => {
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
      "investigation-detail",
      30,
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

    const { params } = context as RouteContext;
    const { id } = await params;

    if (
      typeof id !== "string" ||
      id.length === 0 ||
      id.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid investigation ID.",
        },
        { status: 400 },
      );
    }

    const investigation = getInvestigationById(id);

    if (!investigation) {
      return NextResponse.json(
        {
          success: false,
          message: "Investigation not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      investigation,
    });
  } catch (error) {
    console.error("Investigation detail error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load investigation.",
      },
      { status: 500 },
    );
  }
});
