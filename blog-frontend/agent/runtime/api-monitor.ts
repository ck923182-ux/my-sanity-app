import { addRequestLog } from "../store"

type ApiRouteHandler = (
  request: Request,
  context?: unknown
) => Response | Promise<Response>

export async function monitorApi<T extends Response>(
  request: Request,
  handler: () => Promise<T>
): Promise<T> {
  const start = performance.now()

  try {
    const response = await handler()

    const duration = Math.round(performance.now() - start)

    const log = {
      id: crypto.randomUUID(),
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
      duration,
      timestamp: Date.now(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    }

    console.log("API MONITOR LOG:", log)

    addRequestLog(log)

    return response
  } catch (error) {
    const duration = Math.round(performance.now() - start)

    const log = {
      id: crypto.randomUUID(),
      method: request.method,
      path: new URL(request.url).pathname,
      status: 500,
      duration,
      timestamp: Date.now(),
      userAgent: request.headers.get("user-agent") ?? undefined,
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
    return monitorApi(request, () => Promise.resolve(handler(request, context)))
  }

  return wrappedHandler as T
} 