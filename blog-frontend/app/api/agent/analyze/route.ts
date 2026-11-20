
import { NextResponse } from "next/server";
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer";
import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";
import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function isValidApiPath(value: string): boolean {
  if (
    value.length > 200 ||
    !value.startsWith("/api/") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("\\") ||
    value.includes("\0")
  ) {
    return false;
  }

  return value.slice(1).split("/").every(
    (segment) =>
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      /^[a-zA-Z0-9_[\].-]+$/.test(segment),
  );
}


export const GET = withApiMonitoring(async (request: Request) => {
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
      "analyze",
      10,
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

    const { searchParams } = new URL(request.url);

    const apiPath = searchParams.get("path");
    const method = searchParams.get("method");

    if (!apiPath || !isValidApiPath(apiPath)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or missing API path.",
        },
        { status: 400 },
      );
    }

    if (method !== null && !ALLOWED_METHODS.includes(method)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid HTTP method.",
        },
        { status: 400 },
      );
    }

    const result = analyzeApiHealth(apiPath, method ?? undefined);

    if (!result) {
      return NextResponse.json({
        success: true,
        found: false,
        message: `No monitoring data found for ${apiPath}`,
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      analysis: result,
    });
  } catch (error) {
    console.error("API health analyzer error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to analyze API health.",
      },
      { status: 500 },
    );
  }
});

