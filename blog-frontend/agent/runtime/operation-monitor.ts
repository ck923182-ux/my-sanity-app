
export type OperationTiming = {
  name: string
  duration: number
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
      name,
      duration,
    },
  }
}

