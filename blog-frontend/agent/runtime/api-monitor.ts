
import {
  addRequestLog,
  reserveRequest,
} from "../store"
import { triggerAutomaticInvestigation } from "../automatic-investigator"
import {
  measureOperation,
  type OperationTiming,
} from "./operation-monitor"

type ApiRouteHandler = (
  request: Request,
  context?: unknown,
  operations?: OperationRecorder
) => Response | Promise<Response>

export type OperationRecorder = {
  measure: <T>(
    name: string,
    operation: () => Promise<T>
  ) => Promise<T>
}

async function getRequestBody(
  request: Request
): Promise<string> {
  if (
    request.method === "GET" ||
    request.method === "HEAD"
  ) {
    return ""
  }

  try {
    return await request.clone().text()
  } catch {
    return ""
  }
}

function createRequestFingerprint(
  request: Request,
  body: string
): string {
  const url = new URL(request.url)

  const ignoredParams = new Set([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
  ])

  const normalizedParams = [...url.searchParams.entries()]
    .filter(([key]) => !ignoredParams.has(key.toLowerCase()))
    .sort(([keyA, valueA], [keyB, valueB]) => {
      const keyComparison = keyA.localeCompare(keyB)

      return keyComparison !== 0
        ? keyComparison
        : valueA.localeCompare(valueB)
    })

  const normalizedSearch = new URLSearchParams(
    normalizedParams
  ).toString()

  return [
    request.method.toUpperCase(),
    url.pathname,
    normalizedSearch,
    body,
  ].join(":")
}

export async function monitorApi<T extends Response>(
  request: Request,
  handler: (
    operations: OperationRecorder
  ) => Promise<T>
): Promise<T> {
  const start = performance.now()
  const timestamp = Date.now()
  const requestId = crypto.randomUUID()

  const requestBody = await getRequestBody(request)

  const requestFingerprint = createRequestFingerprint(
    request,
    requestBody
  )

  // Atomically reserve this request before running its handler.
  const duplicateInfo = reserveRequest(
    requestId,
    requestFingerprint,
    timestamp
  )

  const operationTimings: OperationTiming[] = []

  const operations: OperationRecorder = {
    measure: async <T>(
      name: string,
      operation: () => Promise<T>
    ): Promise<T> => {
      const { result, timing } = await measureOperation(
        name,
        operation
      )

      operationTimings.push(timing)

      return result
    },
  }

  try {
    const response = await handler(operations)

    const duration = Math.round(
      performance.now() - start
    )

    const log = {
      id: requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
      duration,
      timestamp,
      userAgent:
        request.headers.get("user-agent") ?? undefined,
      requestFingerprint,
      isDuplicate: duplicateInfo.isDuplicate,
      duplicateOf: duplicateInfo.duplicateOf,
      duplicateCount: duplicateInfo.duplicateCount,
      operations: operationTimings,
    }

    console.log("API MONITOR LOG:", log)
    addRequestLog(log)

    void triggerAutomaticInvestigation(
      log.path,
      request.url
    )

    return response
  } catch (error) {
    const duration = Math.round(
      performance.now() - start
    )

    const log = {
      id: requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      status: 500,
      duration,
      timestamp,
      userAgent:
        request.headers.get("user-agent") ?? undefined,
      requestFingerprint,
      isDuplicate: duplicateInfo.isDuplicate,
      duplicateOf: duplicateInfo.duplicateOf,
      duplicateCount: duplicateInfo.duplicateCount,
      operations: operationTimings,
    }

    console.log("API MONITOR ERROR:", log)
    addRequestLog(log)

    void triggerAutomaticInvestigation(
      log.path,
      request.url
    )

    throw error
  }
}

export function withApiMonitoring<
  T extends ApiRouteHandler
>(handler: T): T {
  const wrappedHandler = async (
    request: Request,
    context?: unknown
  ) => {
    return monitorApi(request, (operations) =>
      Promise.resolve(
        handler(request, context, operations)
      )
    )
  }

  return wrappedHandler as T
}
