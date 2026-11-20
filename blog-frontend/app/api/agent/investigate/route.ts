
import { NextResponse } from "next/server";

import { createInvestigation } from "@/agent/investigation-service";

import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";

const API_PATH_REGEX = /^\/api\/[a-zA-Z0-9/_-]+$/;

export const POST = withApiMonitoring(async (request: Request) => {
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
      "investigate",
      5,
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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("path" in body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid API path is required.",
        },
        { status: 400 },
      );
    }

    const apiPath = body.path;

    if (
      typeof apiPath !== "string" ||
      apiPath.length > 200 ||
      !API_PATH_REGEX.test(apiPath)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid API path. Provide a valid local /api/... route.",
        },
        { status: 400 },
      );
    }

    const result = await createInvestigation(
      apiPath,
      request.url,
    );

    return NextResponse.json({
      success: true,
      investigationId: result.investigationId,
      apiPath: result.apiPath,

      sourceAnalysis: {
        filePath: result.sourceAnalysis.filePath,
        runtime: result.sourceAnalysis.runtime,
        bottleneck: result.sourceAnalysis.bottleneck,
        rootCause: result.sourceAnalysis.rootCause,
        developerRecommendation:
          result.sourceAnalysis.developerRecommendation,
        sourceContext: result.sourceAnalysis.sourceContext,
      },

      ai: {
        taskId: result.taskId,
        status: "processing",
      },

      message: "API investigation started successfully.",
    });
  } catch (error) {
    console.error("Investigation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to start API investigation.",
      },
      { status: 500 },
    );
  }
});
