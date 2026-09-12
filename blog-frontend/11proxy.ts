import { NextRequest, NextResponse } from "next/server"
import { trackApiRequest } from "./agent/runtime/api-monitor"

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Only monitor our API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Don't monitor the agent's own API later
  if (pathname.startsWith("/api/agent")) {
    return NextResponse.next()
  }

  const start = performance.now()

  const response = NextResponse.next()

  const duration = Math.round(performance.now() - start)

  trackApiRequest({
    method: request.method,
    path: pathname,
    status: response.status,
    duration,
    userAgent: request.headers.get("user-agent") ?? undefined,
  })

  return response
}

export const config = {
  matcher: ["/api/:path*"],
}