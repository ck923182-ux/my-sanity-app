
import fs from "fs"
import path from "path"

const API_ROOT = path.join(process.cwd(), "app", "api")

function getRouteFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return []
  }

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  })

  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...getRouteFiles(fullPath))
      continue
    }

    if (/^route\.(ts|js|tsx|jsx)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function routeSegmentsMatch(
  actualSegments: string[],
  routeSegments: string[]
): boolean {
  let actualIndex = 0

  for (let routeIndex = 0; routeIndex < routeSegments.length; routeIndex++) {
    const routeSegment = routeSegments[routeIndex]

    if (/^\[\[\.\.\..+\]\]$/.test(routeSegment)) {
      return true
    }

    if (/^\[\.\.\..+\]$/.test(routeSegment)) {
      return actualIndex < actualSegments.length
    }

    if (actualIndex >= actualSegments.length) {
      return false
    }

    const isDynamicSegment =
      /^\[[^/]+\]$/.test(routeSegment)

    if (
      !isDynamicSegment &&
      routeSegment !== actualSegments[actualIndex]
    ) {
      return false
    }

    actualIndex++
  }

  return actualIndex === actualSegments.length
}

export function resolveApiRoute(
  apiPath: string
): string | null {
  const cleanPath = apiPath.split("?")[0].replace(/^\/+|\/+$/g, "")

  if (!cleanPath) {
    return null
  }

  const segments = cleanPath.split("/")

  if (segments[0] === "api") {
    segments.shift()
  }

  const routeFiles = getRouteFiles(API_ROOT)

  const matches = routeFiles
    .map((filePath) => {
      const relativePath = path.relative(API_ROOT, filePath)
      const routeSegments = relativePath
        .split(path.sep)
        .slice(0, -1)

      if (!routeSegmentsMatch(segments, routeSegments)) {
        return null
      }

      const staticSegments = routeSegments.filter(
        (segment) => !/^\[.*\]$/.test(segment)
      ).length

      return {
        filePath,
        routeSegments,
        staticSegments,
      }
    })
    .filter(
      (match): match is NonNullable<typeof match> =>
        match !== null
    )
    .sort(
      (a, b) =>
        b.staticSegments - a.staticSegments ||
        b.routeSegments.length - a.routeSegments.length
    )

  const match = matches[0]

  if (!match) {
    return null
  }

  const normalizedSegments = match.routeSegments.map(
    (segment) => segment
  )

  return "/api/" + normalizedSegments.join("/")
}
