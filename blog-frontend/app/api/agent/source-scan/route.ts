
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

function apiPathToRouteCandidates(apiPath: string): string[] {
  const cleanPath = apiPath
    .split("?")[0]
    .replace(/^\/+|\/+$/g, "")

  if (!cleanPath) {
    return []
  }

  const segments = cleanPath.split("/")

  // The route files are searched inside app/api.
  if (segments[0] === "api") {
    segments.shift()
  }

  const apiRoot = path.join(process.cwd(), "app", "api")
  const candidates: string[] = []

  // First, try the exact static route.
  candidates.push(
    path.join(apiRoot, ...segments, "route.ts"),
    path.join(apiRoot, ...segments, "route.js")
  )

  // Then try matching Next.js dynamic route segments.
  // Example:
  // status/monitoring-test -> status/[taskId]/route.ts
  for (let i = segments.length - 1; i >= 0; i--) {
    const dynamicSegments = [...segments]
    dynamicSegments[i] = "[...dynamic]"

    // Catch-all routes are not a valid substitute for every
    // dynamic route, so check the common single-segment form.
    dynamicSegments[i] = "[taskId]"

    candidates.push(
      path.join(apiRoot, ...dynamicSegments, "route.ts"),
      path.join(apiRoot, ...dynamicSegments, "route.js")
    )
  }

  // Remove duplicate candidate paths.
  return [...new Set(candidates)]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const apiPath = searchParams.get("path")

    if (!apiPath) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing API path. Example: ?path=/api/update-post",
        },
        { status: 400 }
      )
    }

    const candidates = apiPathToRouteCandidates(apiPath)

    for (const filePath of candidates) {
      if (!fs.existsSync(filePath)) {
        continue
      }

      const source = fs.readFileSync(filePath, "utf-8")
      const relativePath = path
        .relative(process.cwd(), filePath)
        .split(path.sep)
        .join("/")

      return NextResponse.json({
        success: true,
        found: true,
        apiPath,
        filePath: relativePath,
        source,
      })
    }

    return NextResponse.json({
      success: true,
      found: false,
      apiPath,
      message: "Source file could not be found.",
      searchedPaths: candidates.map((filePath) =>
        path.relative(process.cwd(), filePath).split(path.sep).join("/")
      ),
    })
  } catch (error) {
    console.error("Source scan error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to scan API source.",
      },
      { status: 500 }
    )
  }
}
