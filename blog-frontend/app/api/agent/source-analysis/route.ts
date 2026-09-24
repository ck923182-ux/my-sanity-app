import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

import {
  analyzeSource,
  extractSourceContext,
} from "@/agent/analyzer/source-analyzer"

import { getRequestLogs } from "@/agent/store"

import { detectBottleneck } from "@/agent/analyzer/bottleneck-analyzer"

import {
  generateDeveloperRecommendation,
} from "@/agent/analyzer/developer-recommendation-analyzer"

function analyzeRootCause(
  duration: number,
  bottleneck: {
    name: string
    duration: number
  },
  operations: {
    name: string
    duration: number
  }[],
  matches: {
    name: string
    type: string
    line: number
    code: string
  }[]
) {
  const operation = operations.find(
    (item) =>
      item.name.toLowerCase() ===
      bottleneck.name.toLowerCase()
  )

  return {
    likelyCause: bottleneck.name,

    explanation: operation
      ? `${bottleneck.name} accounts for ${operation.duration}ms of the ${duration}ms request.`
      : `${bottleneck.name} was identified as the primary request bottleneck.`,

    duration,

    bottleneckDuration:
      bottleneck.duration,

    sourceLines:
      matches.map(
        (match) => match.line
      ),
  }
}

function apiPathToRouteCandidates(
  apiPath: string
): string[] {
  const cleanPath = apiPath
    .split("?")[0]
    .replace(/^\/+|\/+$/g, "")

  if (!cleanPath) {
    return []
  }

  const segments =
    cleanPath.split("/")

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

function mapBottleneckToSource(
  bottleneckName: string,
  operations: {
    name: string
    type: string
    line: number
    code: string
  }[]
) {
  const normalizedName =
    bottleneckName.toLowerCase()

  const matches =
    operations.filter(
      (operation) => {
        const operationName =
          operation.name.toLowerCase()

        if (
          normalizedName.includes("patch") &&
          normalizedName.includes("commit")
        ) {
          return (
            operationName.includes("patch") ||
            operationName.includes("commit")
          )
        }

        if (
          normalizedName.includes("fetch")
        ) {
          return operationName.includes(
            "fetch"
          )
        }

        if (
          normalizedName.includes(
            "request.json"
          )
        ) {
          return operationName.includes(
            "request.json"
          )
        }

        if (
          normalizedName.includes(
            "formdata"
          )
        ) {
          return operationName.includes(
            "formdata"
          )
        }

        return (
          operationName ===
          normalizedName
        )
      }
    )

  if (matches.length === 0) {
    return null
  }

  return {
    operation: bottleneckName,

    lines: matches.map(
      (operation) =>
        operation.line
    ),

    matches,
  }
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
        {
          status: 400,
        }
      )
    }

    const candidates =
      apiPathToRouteCandidates(
        apiPath
      )

    for (const filePath of candidates) {
      if (!fs.existsSync(filePath)) {
        continue
      }

      const source =
        fs.readFileSync(
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

      const logs =
        getRequestLogs()

      const matchingLogs =
        logs
          .filter(
            (log) =>
              log.path === apiPath &&
              log.operations &&
              log.operations.length > 0
          )
          .sort(
            (a, b) =>
              b.timestamp -
              a.timestamp
          )

      const latestLog =
        matchingLogs[0]

      let bottleneck = null

      if (latestLog) {
        bottleneck =
          detectBottleneck(
            latestLog.duration,
            latestLog.operations ??
              []
          )
      }

      let sourceLocation:
        | {
            operation: string
            filePath: string
            lines: number[]
            matches: {
              name: string
              type: string
              line: number
              code: string
            }[]
          }
        | null = null

      let sourceContext = null

      if (bottleneck) {
        const mappedSource =
          mapBottleneckToSource(
            bottleneck.name,
            analysis.operations
          )

        if (mappedSource) {
          sourceLocation = {
            ...mappedSource,
            filePath:
              relativePath,
          }

          sourceContext =
            extractSourceContext(
              source,
              mappedSource.lines,
              3
            )
        }
      }

      let rootCause = null

      if (
        bottleneck &&
        latestLog &&
        sourceLocation
      ) {
        rootCause =
          analyzeRootCause(
            latestLog.duration,
            bottleneck,
            latestLog.operations ??
              [],
            sourceLocation.matches
          )
      }

      let developerRecommendation =
        null

      if (rootCause) {
        const percentage =
          bottleneck
            ? bottleneck.percentage
            : 0

        const confidence =
          percentage >= 80 &&
          sourceLocation
            ? "high"
            : percentage >= 50 ||
                sourceLocation
              ? "medium"
              : "low"

        developerRecommendation =
          generateDeveloperRecommendation(
            {
              category:
                rootCause.likelyCause
                  .toLowerCase()
                  .includes("sanity") ||
                rootCause.likelyCause
                  .toLowerCase()
                  .includes("commit") ||
                rootCause.likelyCause
                  .toLowerCase()
                  .includes("patch")
                  ? "database-operation"
                  : "unknown",

              confidence,

              operation:
                rootCause.likelyCause,

              duration:
                rootCause.bottleneckDuration,

              percentage,

              evidence: [
                {
                  type: "runtime",
                  message:
                    rootCause.explanation,
                },

                {
                  type: "bottleneck",
                  message:
                    `${rootCause.likelyCause} accounts for ${percentage}% of the measured request duration.`,
                },

                ...(sourceLocation
                  ? [
                      {
                        type: "source" as const,
                        message:
                          `The operation maps to source lines ${sourceLocation.lines.join(", ")}.`,
                      },
                    ]
                  : []),
              ],
            }
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

        sourceLocation,

        sourceContext,

        rootCause,

        developerRecommendation,
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
      {
        status: 500,
      }
    )
  }
}