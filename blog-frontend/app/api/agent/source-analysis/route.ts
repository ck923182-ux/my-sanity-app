
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

import { analyzeSource } from "@/agent/analyzer/source-analyzer"
import { getRequestLogs } from "@/agent/store"
import { detectBottleneck } from "@/agent/analyzer/bottleneck-analyzer"

function apiPathToRouteCandidates(
  apiPath: string
): string[] {
  const cleanPath = apiPath
    .split("?")[0]
    .replace(/^\/+|\/+$/g, "")

  if (!cleanPath) {
    return []
  }

  const segments = cleanPath.split("/")

  if (segments[0] === "api") {
    segments.shift()
  }

  return [
    path.join(
      process.cwd(),
      "app",
      "api",
      ...segments,
      "route.ts"
    ),

    path.join(
      process.cwd(),
      "app",
      "api",
      ...segments,
      "route.js"
    ),
  ]
}

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url)

    const apiPath =
      searchParams.get("path")

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
      if (!fs.existsSync(filePath)) {
        continue
      }

      const source = fs.readFileSync(
        filePath,
        "utf-8"
      )

      const relativePath =
        path
          .relative(
            process.cwd(),
            filePath
          )
          .replace(/\\/g, "/")

      const analysis =
        analyzeSource(
          source,
          relativePath
        )

      // Find the latest runtime log
      // for this API endpoint.
      const logs = getRequestLogs()

      const matchingLogs = logs
        .filter(
          (log) =>
            log.path === apiPath &&
            log.operations &&
            log.operations.length > 0
        )
        .sort(
          (a, b) =>
            b.timestamp - a.timestamp
        )

      const latestLog =
        matchingLogs[0]

      let bottleneck = null

      if (latestLog) {
        bottleneck =
          detectBottleneck(
            latestLog.duration,
            latestLog.operations ?? []
          )
      }

      return NextResponse.json({
        success: true,
        found: true,
        apiPath,
        ...analysis,

        runtime: latestLog
          ? {
              duration:
                latestLog.duration,

              status:
                latestLog.status,

              timestamp:
                latestLog.timestamp,

              operations:
                latestLog.operations,
            }
          : null,

        bottleneck,
      })
    }

    return NextResponse.json({
      success: true,
      found: false,
      apiPath,
      message:
        "Source file could not be found.",
    })
  } catch (error) {
    console.error(
      "Source analysis error:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to analyze API source.",
      },
      { status: 500 }
    )
  }
}

// http://localhost:3000/api/agent/source-analysis?path=/api/update-post