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

  const segments = cleanPath.split("/").filter(Boolean)

  return [
    path.join("app", ...segments, "route.ts"),
    path.join("app", ...segments, "route.js"),
    path.join("app", ...segments, "route.tsx"),
    path.join("app", ...segments, "route.jsx"),
  ]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const apiPath = searchParams.get("path")

    if (!apiPath) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required query parameter: path",
        },
        { status: 400 }
      )
    }

    if (!apiPath.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Only /api/* paths are allowed",
        },
        { status: 400 }
      )
    }

    const projectRoot = process.cwd()

    const candidates = apiPathToRouteCandidates(apiPath)

    for (const relativePath of candidates) {
      const absolutePath = path.join(projectRoot, relativePath)

      if (fs.existsSync(absolutePath)) {
        const sourceCode = fs.readFileSync(absolutePath, "utf-8")

        return NextResponse.json({
          success: true,
          found: true,
          routePath: relativePath,
          sourceCode,
        })
      }
    }

    return NextResponse.json({
      success: true,
      found: false,
      routePath: null,
      sourceCode: null,
      message: `No route source found for ${apiPath}`,
    })
  } catch (error) {
    console.error("source-scan error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to scan API source",
      },
      { status: 500 }
    )
  }
}