
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import {
  authorizeAdminApi,
  getCurrentSession,
} from "@/auth/guards";

import { consumeRateLimit } from "@/agent/runtime/rate-limiter";
import { withApiMonitoring } from "@/agent/runtime/api-monitor";

function apiPathToRouteCandidates(apiPath: string): string[] {
  if (
    !apiPath.startsWith("/api/") ||
    apiPath.length > 200 ||
    apiPath.includes("?") ||
    apiPath.includes("#") ||
    apiPath.includes("\\") ||
    apiPath.includes("\0")
  ) {
    return [];
  }

  const segments = apiPath.slice(1).split("/");

  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        !/^[a-zA-Z0-9_[\].-]+$/.test(segment),
    )
  ) {
    return [];
  }

  const apiRoot = path.resolve(process.cwd(), "app", "api");
  const routeSegments = segments.slice(1);
  const candidates: string[] = [];

  const addCandidate = (route: string[]) => {
    for (const extension of ["ts", "js"]) {
      const candidate = path.resolve(apiRoot, ...route, `route.${extension}`);

      const relative = path.relative(apiRoot, candidate);

      if (
        relative !== ".." &&
        !relative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relative)
      ) {
        candidates.push(candidate);
      }
    }
  };

  addCandidate(routeSegments);

  for (let i = routeSegments.length - 1; i >= 0; i--) {
    const dynamicSegments = [...routeSegments];
    dynamicSegments[i] = "[taskId]";
    addCandidate(dynamicSegments);
  }

  return [...new Set(candidates)];
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
      "source-scan",
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

    if (
      !apiPath ||
      !apiPath.startsWith("/api/") ||
      apiPath.length > 200 ||
      apiPath.includes("?") ||
      apiPath.includes("#") ||
      apiPath.includes("\\") ||
      apiPath.includes("\0")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid API path.",
        },
        { status: 400 },
      );
    }

    const candidates = apiPathToRouteCandidates(apiPath);

    if (candidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid API route format.",
        },
        { status: 400 },
      );
    }

    for (const filePath of candidates) {
      if (!fs.existsSync(filePath)) {
        continue;
      }

      const source = fs.readFileSync(filePath, "utf-8");
      const relativePath = path
        .relative(process.cwd(), filePath)
        .split(path.sep)
        .join("/");

      return NextResponse.json({
        success: true,
        found: true,
        apiPath,
        filePath: relativePath,
        source,
      });
    }

    return NextResponse.json({
      success: true,
      found: false,
      apiPath,
      message: "Source file could not be found.",
      searchedPaths: candidates.map((filePath) =>
        path.relative(process.cwd(), filePath).split(path.sep).join("/"),
      ),
    });
  } catch (error) {
    console.error("Source scan error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to scan API source.",
      },
      { status: 500 },
    );
  }
});
