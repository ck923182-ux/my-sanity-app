import { addRequestLog } from "../store"

export async function monitorApi<T extends Response>(
  request: Request,
  handler: () => Promise<T>
): Promise<T> {
  const start = performance.now()

  try {
    const response = await handler()

    const duration = Math.round(performance.now() - start)

    addRequestLog({
      id: crypto.randomUUID(),
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
      duration,
      timestamp: Date.now(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    })

    return response
  } catch (error) {
    const duration = Math.round(performance.now() - start)

    addRequestLog({
      id: crypto.randomUUID(),
      method: request.method,
      path: new URL(request.url).pathname,
      status: 500,
      duration,
      timestamp: Date.now(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    })

    throw error
  }
}