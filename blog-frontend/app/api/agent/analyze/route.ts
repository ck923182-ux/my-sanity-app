
import { NextResponse } from "next/server";
import { analyzeApiHealth } from "@/agent/analyzer/health-analyzer";
import { authorizeAdminApi } from "@/auth/guards";

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

export async function GET(request: Request) {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

  try {
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

    if (
      method !== null &&
      !ALLOWED_METHODS.includes(method)
    ) {
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
}
