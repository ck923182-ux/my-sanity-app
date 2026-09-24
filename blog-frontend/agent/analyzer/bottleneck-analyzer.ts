
import type { OperationTiming } from "@/agent/types"

export type Bottleneck = {
  name: string
  duration: number
  percentage: number
}

export function detectBottleneck(
  totalDuration: number,
  operations: OperationTiming[]
): Bottleneck | null {
  if (
    totalDuration <= 0 ||
    operations.length === 0
  ) {
    return null
  }

  const sortedOperations = [...operations].sort(
    (a, b) => b.duration - a.duration
  )

  const slowest = sortedOperations[0]

  const percentage = Math.round(
    (slowest.duration / totalDuration) * 100
  )

  return {
    name: slowest.name,
    duration: slowest.duration,
    percentage,
  }
}


//API Request
 //  ↓
// Runtime Operation Timing
//    ↓
// Bottleneck Detection
//    ↓
// Source Analysis