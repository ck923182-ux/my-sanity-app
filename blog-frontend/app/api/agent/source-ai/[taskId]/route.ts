
import { NextResponse } from "next/server";

import { getSourceAnalysisDiagnosis } from "@/agent/ai/source-analysis-agent";

import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";

type RouteContext = {
  params: Promise<{
    taskId: string;
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
      "source-ai-poll",
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
    const { taskId } = await params;

    if (
      typeof taskId !== "string" ||
      taskId.trim().length === 0 ||
      taskId.length > 200
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task ID.",
        },
        { status: 400 },
      );
    }

    const diagnosis = await getSourceAnalysisDiagnosis(taskId);

    if (!diagnosis) {
      return NextResponse.json({
        success: true,
        taskId,
        status: "processing",
        diagnosis: null,
      });
    }

    return NextResponse.json({
      success: true,
      taskId,
      status: "completed",
      diagnosis,
    });
  } catch (error) {
    console.error("Source AI polling error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve source analysis diagnosis.",
      },
      { status: 500 },
    );
  }
});
