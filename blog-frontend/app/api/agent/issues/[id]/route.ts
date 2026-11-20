
import { NextResponse } from "next/server";

import {
  updateIssueStatus,
  type IssueStatus,
} from "@/agent/issue-store";

import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_STATUSES: IssueStatus[] = [
  "open",
  "investigating",
  "resolved",
];

export const PATCH = withApiMonitoring(async (
  request: Request,
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
      "issue-management",
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
        { success: false, error: "Invalid issue ID." },
        { status: 400 },
      );
    }

    const body: unknown = await request.json().catch(() => null);

    if (
      typeof body !== "object" ||
      body === null ||
      !("status" in body) ||
      typeof body.status !== "string" ||
      !ALLOWED_STATUSES.includes(body.status as IssueStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Use "open", "investigating", or "resolved".',
        },
        { status: 400 },
      );
    }

    const issue = updateIssueStatus(id, body.status as IssueStatus);

    if (!issue) {
      return NextResponse.json(
        { success: false, error: "Issue not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      issue,
    });
  } catch (error) {
    console.error("Failed to update issue status:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update issue status.",
      },
      { status: 500 },
    );
  }
});
