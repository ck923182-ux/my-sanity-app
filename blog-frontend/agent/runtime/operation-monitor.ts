
export type OperationTiming = {
  name: string
  duration: number
}

function sanitizeOperationName(name: string): string {
  return name
    .replace(
      /\b(token|password|secret|authorization|api[_-]?key)\s*[:=]\s*\S+/gi,
      "$1=[REDACTED]"
    )
    .replace(/[\r\n\t]/g, " ")
    .slice(0, 100);
}

export async function measureOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<{
  result: T
  timing: OperationTiming
}> {
  const start = performance.now()

  const result = await operation()

  const duration = Math.round(
    performance.now() - start
  )

  return {
    result,
    timing: {
      name: sanitizeOperationName(name),
      duration,
    },
  }
}

