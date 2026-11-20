
import { createHmac } from "node:crypto";
import { db } from "@/agent/runtime/database";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
};

type RateLimitRow = {
  window_started_at: number;
  request_count: number;
  expires_at: number;
};

export function consumeRateLimit(
  userId: string,
  bucket: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Rate limiter configuration is invalid.");
  }

  if (
    !userId ||
    !bucket ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(windowMs) ||
    windowMs < 1
  ) {
    throw new Error("Invalid rate limit configuration.");
  }

  const bucketKey = createHmac("sha256", secret)
    .update(`${userId}:${bucket}`)
    .digest("hex");

  const now = Date.now();
cleanupExpiredRateLimits(now);
  const consume = db.transaction((): RateLimitResult => {
    const row = db
      .prepare(
        `SELECT window_started_at, request_count, expires_at
         FROM agent_rate_limits
         WHERE bucket_key = ?`,
      )
      .get(bucketKey) as RateLimitRow | undefined;

    if (!row || row.expires_at <= now) {
      db.prepare(
        `INSERT INTO agent_rate_limits (
          bucket_key,
          window_started_at,
          request_count,
          expires_at
        )
        VALUES (?, ?, 1, ?)
        ON CONFLICT(bucket_key) DO UPDATE SET
          window_started_at = excluded.window_started_at,
          request_count = 1,
          expires_at = excluded.expires_at`,
      ).run(bucketKey, now, now + windowMs);

      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        retryAfter: Math.ceil(windowMs / 1000),
      };
    }

    if (row.request_count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        retryAfter: Math.max(
          1,
          Math.ceil((row.expires_at - now) / 1000),
        ),
      };
    }

    db.prepare(
      `UPDATE agent_rate_limits
       SET request_count = request_count + 1
       WHERE bucket_key = ?`,
    ).run(bucketKey);

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - row.request_count - 1),
      retryAfter: Math.max(
        1,
        Math.ceil((row.expires_at - now) / 1000),
      ),
    };
  });

  return consume.immediate();
}
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 500;

let lastCleanupAt = 0;

function cleanupExpiredRateLimits(now: number): void {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  const cleanup = db.transaction(() => {
    db.prepare(
      `DELETE FROM agent_rate_limits
       WHERE bucket_key IN (
         SELECT bucket_key
         FROM agent_rate_limits
         WHERE expires_at <= ?
         ORDER BY expires_at ASC
         LIMIT ?
       )`,
    ).run(now, CLEANUP_BATCH_SIZE);
  });

  cleanup.immediate();
  lastCleanupAt = now;
}