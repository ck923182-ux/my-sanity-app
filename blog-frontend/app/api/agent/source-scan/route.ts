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

  // Remove "api" because we already search inside app/api
  if (segments[0] === "api") {
    segments.shift()
  }

  const candidates: string[] = []

  // Example:
  // /api/update-post
  //
  // app/api/update-post/route.ts

  candidates.push(
    path.join(
      process.cwd(),
      "app",
      "api",
      ...segments,
      "route.ts"
    )
  )

  // Also support route.js
  candidates.push(
    path.join(
      process.cwd(),
      "app",
      "api",
      ...segments,
      "route.js"
    )
  )

  return candidates
}

export async function GET(
  request: Request
) {
  try {
    const { searchParams } = new URL(
      request.url
    )

    const apiPath = searchParams.get("path")

    if (!apiPath) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing API path. Example: ?path=/api/update-post",
        },
        { status: 400 }
      )
    }

    const candidates =
      apiPathToRouteCandidates(apiPath)

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const source = fs.readFileSync(
          filePath,
          "utf-8"
        )

        const relativePath =
          path.relative(
            process.cwd(),
            filePath
          )

        return NextResponse.json({
          success: true,
          found: true,
          apiPath,
          filePath: relativePath.replace(
            /\\/g,
            "/"
          ),
          source,
        })
      }
    }

    return NextResponse.json({
      success: true,
      found: false,
      apiPath,
      message:
        "Source file could not be found.",
      searchedPaths: candidates.map(
        (filePath) =>
          path
            .relative(
              process.cwd(),
              filePath
            )
            .replace(/\\/g, "/")
      ),
    })
  } catch (error) {
    console.error(
      "Source scan error:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to scan API source.",
      },
      { status: 500 }
    )
  }
}