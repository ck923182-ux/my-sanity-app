
import type { ApiRequestLog } from "./types"
import { db } from "./runtime/database"

const MAX_LOGS = 5000
const DUPLICATE_WINDOW_MS = 5000

type StoredLog = {
  id: string
  method: string
  path: string
  status: number
  duration: number
  timestamp: number
  user_agent: string | null
  request_fingerprint: string | null
  is_duplicate: number
  duplicate_of: string | null
  duplicate_count: number
  operations_json: string
}

export type DuplicateReservation = {
  isDuplicate: boolean
  duplicateOf?: string
  duplicateCount: number
}

const insertLog = db.prepare(`
  INSERT OR REPLACE INTO api_request_logs (
    id,
    method,
    path,
    status,
    duration,
    timestamp,
    user_agent,
    request_fingerprint,
    is_duplicate,
    duplicate_of,
    duplicate_count,
    operations_json
  ) VALUES (
    @id,
    @method,
    @path,
    @status,
    @duration,
    @timestamp,
    @user_agent,
    @request_fingerprint,
    @is_duplicate,
    @duplicate_of,
    @duplicate_count,
    @operations_json
  )
`)

const selectLogs = db.prepare(`
  SELECT *
  FROM api_request_logs
  ORDER BY timestamp DESC
  LIMIT @limit
`)

const countLogs = db.prepare(`
  SELECT COUNT(*) AS total
  FROM api_request_logs
`)

const trimLogs = db.prepare(`
  DELETE FROM api_request_logs
  WHERE id NOT IN (
    SELECT id
    FROM api_request_logs
    ORDER BY timestamp DESC
    LIMIT @limit
  )
`)

const deleteExpiredReservations = db.prepare(`
  DELETE FROM api_request_reservations
  WHERE timestamp < ?
`)

const findMatchingReservations = db.prepare(`
  SELECT request_id, timestamp
  FROM api_request_reservations
  WHERE fingerprint = ?
    AND timestamp >= ?
    AND timestamp <= ?
  ORDER BY timestamp ASC
`)

const insertReservation = db.prepare(`
  INSERT INTO api_request_reservations (
    request_id,
    fingerprint,
    timestamp
  ) VALUES (?, ?, ?)
`)

const reserveRequestTransaction = db.transaction(
  (
    requestId: string,
    fingerprint: string,
    timestamp: number
  ): DuplicateReservation => {
    deleteExpiredReservations.run(
      timestamp - DUPLICATE_WINDOW_MS
    )

    const matches = findMatchingReservations.all(
      fingerprint,
      timestamp - DUPLICATE_WINDOW_MS,
      timestamp
    ) as Array<{
      request_id: string
      timestamp: number
    }>

    insertReservation.run(
      requestId,
      fingerprint,
      timestamp
    )

    if (matches.length === 0) {
      return {
        isDuplicate: false,
        duplicateCount: 0,
      }
    }

    return {
      isDuplicate: true,
      duplicateOf: matches[0].request_id,
      duplicateCount: matches.length,
    }
  }
)

export function reserveRequest(
  requestId: string,
  fingerprint: string,
  timestamp: number
): DuplicateReservation {
  return reserveRequestTransaction.immediate(
    requestId,
    fingerprint,
    timestamp
  )
}

function toStoredLog(log: ApiRequestLog) {
  return {
    id: log.id,
    method: log.method,
    path: log.path,
    status: log.status,
    duration: log.duration,
    timestamp: log.timestamp,
    user_agent: log.userAgent ?? null,
    request_fingerprint: log.requestFingerprint ?? null,
    is_duplicate: log.isDuplicate ? 1 : 0,
    duplicate_of: log.duplicateOf ?? null,
    duplicate_count: log.duplicateCount,
    operations_json: JSON.stringify(log.operations ?? []),
  }
}

function fromStoredLog(row: StoredLog): ApiRequestLog {
  return {
    id: row.id,
    method: row.method,
    path: row.path,
    status: row.status,
    duration: row.duration,
    timestamp: row.timestamp,
    userAgent: row.user_agent ?? undefined,
    requestFingerprint: row.request_fingerprint ?? undefined,
    isDuplicate: row.is_duplicate === 1,
    duplicateOf: row.duplicate_of ?? undefined,
    duplicateCount: row.duplicate_count,
    operations: JSON.parse(row.operations_json),
  }
}

export function addRequestLog(log: ApiRequestLog) {
  insertLog.run(toStoredLog(log))
  trimLogs.run({ limit: MAX_LOGS })

  console.log("AGENT STORE: Request log persisted", {
    id: log.id,
    path: log.path,
    status: log.status,
  })
}

export function getRequestLogs(): ApiRequestLog[] {
  const rows = selectLogs.all({
    limit: MAX_LOGS,
  }) as StoredLog[]

  return rows.map(fromStoredLog)
}

export function clearRequestLogs() {
  db.exec("DELETE FROM api_request_logs")
  db.exec("DELETE FROM api_request_reservations")
}

export function getRequestLogCount(): number {
  const result = countLogs.get() as { total: number }
  return result.total
}
