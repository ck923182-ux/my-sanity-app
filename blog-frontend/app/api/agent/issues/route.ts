
import { NextResponse } from "next/server";
import { getIssues } from "@/agent/issue-store";

import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      "issues",
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

    const issues = getIssues();

    const open = issues.filter((issue) => issue.status === "open").length;

    const investigating = issues.filter(
      (issue) => issue.status === "investigating",
    ).length;

    const resolved = issues.filter(
      (issue) => issue.status === "resolved",
    ).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: issues.length,
        open,
        investigating,
        resolved,
        recurring: issues.filter((issue) => issue.occurrenceCount > 1).length,
      },
      issues,
    });
  } catch (error) {
    console.error("Failed to load issue history:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load issue history.",
      },
      { status: 500 },
    );
  }
});
