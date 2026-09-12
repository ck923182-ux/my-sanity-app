export type ApiRequestLog = {
  id: string
  method: string
  path: string
  status: number
  duration: number
  timestamp: number
  userAgent?: string
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
}