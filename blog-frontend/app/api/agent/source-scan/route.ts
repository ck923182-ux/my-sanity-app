import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { authorizeAdminApi } from "@/auth/guards";

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

export async function GET(request: Request) {
  const authError = await authorizeAdminApi();

  if (authError) return authError;
  try {
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
}
