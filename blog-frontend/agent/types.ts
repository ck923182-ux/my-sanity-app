export type ApiRequestLog = {
  id: string
  method: string
  path: string
  status: number
  duration: number
  timestamp: number
  userAgent?: string

   requestFingerprint?: string
  isDuplicate?: boolean
  duplicateOf?: string
  duplicateCount?: number
}

export type ApiStats = {
  path: string
  method: string

  totalCalls: number
  successCalls: number
  errorCalls: number

  averageDuration: number
  maxDuration: number

  duplicateCalls: number

  errorRate: number 
  health: "healthy" | "warning" | "critical"
  issues: string[]
}