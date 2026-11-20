
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const tempDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "rate-limit-cleanup-test-"),
  );

  process.env.AGENT_DATABASE_PATH = path.join(
    tempDirectory,
    "test.sqlite",
  );

  process.env.BETTER_AUTH_SECRET =
    "test-secret-for-rate-limiter-testing-only-123456789";

  let db:
    | typeof import("../agent/runtime/database").db
    | undefined;

  try {
    const database = await import("../agent/runtime/database");
    db = database.db;

    const { consumeRateLimit } = await import(
      "../agent/runtime/rate-limiter"
    );

    const now = Date.now();

    // Insert 501 expired buckets.
    const insert = db.prepare(`
      INSERT INTO agent_rate_limits (
        bucket_key,
        window_started_at,
        request_count,
        expires_at
      )
      VALUES (?, ?, ?, ?)
    `);

    const seedExpired = db.transaction(() => {
      for (let i = 1; i <= 501; i++) {
        insert.run(`expired-bucket-${i}`, now - 120_000, 5, now - 1);
      }
    });

    seedExpired();

    // Insert one active bucket.
    insert.run("active-bucket", now, 1, now + 60_000);

    // First request triggers cleanup.
    const firstRequest = consumeRateLimit(
      "cleanup-test-admin",
      "cleanup-test",
      5,
      60_000,
    );

    const expiredAfterFirstCleanup = (
      db.prepare(
        "SELECT COUNT(*) AS count FROM agent_rate_limits WHERE expires_at <= ?",
      ).get(Date.now()) as { count: number }
    ).count;

    const activeBucketPreserved = Boolean(
      db.prepare(
        "SELECT bucket_key FROM agent_rate_limits WHERE bucket_key = ?",
      ).get("active-bucket"),
    );

    // Add another expired bucket.
    insert.run("expired-after-first-cleanup", now - 120_000, 1, now - 1);

    // Cleanup interval should prevent another cleanup immediately.
    consumeRateLimit(
      "cleanup-test-admin",
      "cleanup-test",
      5,
      60_000,
    );

    const expiredAfterSecondRequest = (
      db.prepare(
        "SELECT COUNT(*) AS count FROM agent_rate_limits WHERE expires_at <= ?",
      ).get(Date.now()) as { count: number }
    ).count;

    // Verify normal rate limiting still works.
    const limitedFirst = consumeRateLimit(
      "limit-test-admin",
      "limit-test",
      1,
      60_000,
    );

    const limitedSecond = consumeRateLimit(
      "limit-test-admin",
      "limit-test",
      1,
      60_000,
    );

    const passed =
      firstRequest.allowed &&
      expiredAfterFirstCleanup === 1 &&
      activeBucketPreserved &&
      expiredAfterSecondRequest === 2 &&
      limitedFirst.allowed &&
      !limitedSecond.allowed;

    console.log("\n--- RATE LIMIT CLEANUP TEST ---");

    console.log({
      firstRequestAllowed: firstRequest.allowed,
      expiredAfterFirstCleanup,
      activeBucketPreserved,
      expiredAfterSecondRequest,
      cleanupIntervalRespected: expiredAfterSecondRequest === 2,
      rateLimitingStillWorks:
        limitedFirst.allowed && !limitedSecond.allowed,
      result: passed ? "PASS" : "FAIL",
    });

    if (!passed) {
      process.exitCode = 1;
    }
  } finally {
    if (db?.open) {
      db.close();
    }

    fs.rmSync(tempDirectory, {
      recursive: true,
      force: true,
    });
  }
}

main().catch((error) => {
  console.error("RATE LIMIT CLEANUP TEST FAILED:", error);
  process.exitCode = 1;
});
