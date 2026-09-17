// import { addRequestLog } from "../store"

// type ApiRouteHandler = (
//   request: Request,
//   context?: unknown
// ) => Response | Promise<Response>

// export async function monitorApi<T extends Response>(
//   request: Request,
//   handler: () => Promise<T>
// ): Promise<T> {
//   const start = performance.now()

//   try {
//     const response = await handler()

//     const duration = Math.round(performance.now() - start)

//     const log = {
//       id: crypto.randomUUID(),
//       method: request.method,
//       path: new URL(request.url).pathname,
//       status: response.status,
//       duration,
//       timestamp: Date.now(),
//       userAgent: request.headers.get("user-agent") ?? undefined,
//     }

//     console.log("API MONITOR LOG:", log)

//     addRequestLog(log)

//     return response
//   } catch (error) {
//     const duration = Math.round(performance.now() - start)

//     const log = {
//       id: crypto.randomUUID(),
//       method: request.method,
//       path: new URL(request.url).pathname,
//       status: 500,
//       duration,
//       timestamp: Date.now(),
//       userAgent: request.headers.get("user-agent") ?? undefined,
//     }

//     console.log("API MONITOR ERROR:", log)

//     addRequestLog(log)

//     throw error
//   }
// }

// export function withApiMonitoring<T extends ApiRouteHandler>(
//   handler: T
// ): T {
//   const wrappedHandler = async (
//     request: Request,
//     context?: unknown
//   ) => {
//     return monitorApi(request, () => Promise.resolve(handler(request, context)))
//   }

//   return wrappedHandler as T
// } 
import { addRequestLog, getRequestLogs } from "../store"

type ApiRouteHandler = (
  request: Request,
  context?: unknown
) => Response | Promise<Response>

const DUPLICATE_WINDOW_MS = 5000

async function getRequestBody(request: Request): Promise<string> {
  if (request.method === "GET" || request.method === "HEAD") {
    return ""
  }

  try {
    const clonedRequest = request.clone()
    return await clonedRequest.text()
  } catch {
    return ""
  }
}

function createRequestFingerprint(
  request: Request,
  body: string
): string {
  const url = new URL(request.url)

  return [
    request.method,
    url.pathname,
    url.search,
    body,
  ].join(":")
}

function detectDuplicate(
  fingerprint: string,
  timestamp: number
) {
  const logs = getRequestLogs()

  const recentMatchingLogs = logs.filter(
    (log) =>
      log.requestFingerprint === fingerprint &&
      timestamp - log.timestamp <= DUPLICATE_WINDOW_MS
  )

  if (recentMatchingLogs.length === 0) {
    return {
      isDuplicate: false,
      duplicateOf: undefined,
      duplicateCount: 0,
    }
  }

  const firstMatchingRequest = recentMatchingLogs[0]

  return {
    isDuplicate: true,
    duplicateOf: firstMatchingRequest.id,
    duplicateCount: recentMatchingLogs.length,
  }
}

export async function monitorApi<T extends Response>(
  request: Request,
  handler: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  const timestamp = Date.now()

  const requestBody = await getRequestBody(request)

  const requestFingerprint = createRequestFingerprint(
    request,
    requestBody
  )

  const duplicateInfo = detectDuplicate(
    requestFingerprint,
    timestamp
  )

  try {
    const response = await handler()

    const duration = Math.round(
      performance.now() - start
    )

    const log = {
      id: crypto.randomUUID(),
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
    }

    console.log("API MONITOR LOG:", log)

    addRequestLog(log)

    return response
  } catch (error) {
    const duration = Math.round(
      performance.now() - start
    )

    const log = {
      id: crypto.randomUUID(),
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
    }

    console.log("API MONITOR ERROR:", log)

    addRequestLog(log)

    throw error
  }
}

export function withApiMonitoring<T extends ApiRouteHandler>(
  handler: T
): T {
  const wrappedHandler = async (
    request: Request,
    context?: unknown
  ) => {
    return monitorApi(
      request,
      () =>
        Promise.resolve(
          handler(request, context)
        )
    )
  }

  return wrappedHandler as T
}