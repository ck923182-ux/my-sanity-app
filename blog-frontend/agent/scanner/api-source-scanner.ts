import fs from "node:fs/promises"
import path from "node:path"

export type ApiSourceResult = {
  found: boolean
  routePath: string
  sourceCode?: string
  error?: string
}

async function findRouteFile(
  currentDir: string,
  segments: string[],
  index: number
): Promise<string | null> {
  if (index === segments.length) {
    const routeFile = path.join(
      currentDir,
      "route.ts"
    )

    try {
      await fs.access(routeFile)
      return routeFile
    } catch {
      return null
    }
  }

  const segment = segments[index]

  // Try exact folder first
  const exactDir = path.join(
    currentDir,
    segment
  )

  try {
    const stat = await fs.stat(exactDir)

    if (stat.isDirectory()) {
      const result = await findRouteFile(
        exactDir,
        segments,
        index + 1
      )

      if (result) {
        return result
      }
    }
  } catch {
    // Exact directory does not exist.
  }

  // Try dynamic route folder
  try {
    const entries = await fs.readdir(
      currentDir,
      { withFileTypes: true }
    )

    const dynamicDir = entries.find(
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith("[") &&   
        entry.name.endsWith("]")
    )

    if (dynamicDir) {
      const result = await findRouteFile(
        path.join(
          currentDir,
          dynamicDir.name
        ),
        segments,
        index + 1
      )

      if (result) {
        return result
      }
    }
  } catch {
    // Ignore filesystem errors.
  }

  return null
}

export async function scanApiSource(
  apiPath: string
): Promise<ApiSourceResult> {
  const cleanPath = apiPath
    .split("?")[0]
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")

  const segments = cleanPath
    .split("/")
    .filter(Boolean)

  const appDir = path.join(
    process.cwd(),
    "app"
  )

  const routeFile = await findRouteFile(
    appDir,
    segments,
    0
  )

  if (!routeFile) {
    return {
      found: false,
      routePath: "",
      error: `Route source file not found for ${apiPath}`,
    }
  }

  try {
    const sourceCode = await fs.readFile(
      routeFile,
      "utf8"
    )

    return {
      found: true,
      routePath: path.relative(
        process.cwd(),
        routeFile
      ),
      sourceCode,
    }
  } catch {
    return {
      found: false,
      routePath: path.relative(
        process.cwd(),
        routeFile
      ),
      error: "Failed to read route source",
    }
  }
}