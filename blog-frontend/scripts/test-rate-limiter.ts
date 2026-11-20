
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const tempDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "rate-limiter-test-"),
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

    const userA = "test-admin-a";
    const userB = "test-admin-b";

    const bucket = "source-ai-test";
    const limit = 5;
    const windowMs = 60_000;

    // First five requests must be allowed.
    const firstFive = Array.from({ length: 5 }, () =>
      consumeRateLimit(userA, bucket, limit, windowMs),
    );

    const firstFiveAllowed = firstFive.every(
      (result) => result.allowed,
    );

    // Sixth request must be rejected.
    const sixthRequest = consumeRateLimit(
      userA,
      bucket,
      limit,
      windowMs,
    );

    const sixthRequestRejected = !sixthRequest.allowed;

    const retryAfterReturned =
      sixthRequest.retryAfter > 0 &&
      sixthRequest.retryAfter <= 60;

    // A different admin must have an independent bucket.
    const independentUser = consumeRateLimit(
      userB,
      bucket,
      limit,
      windowMs,
    );

    const independentUserAllowed = independentUser.allowed;

    // Verify remaining count.
    const remainingCorrect =
      firstFive[0].remaining === 4 &&
      firstFive[4].remaining === 0;

    // Simulate expiry without waiting 60 seconds.
    db.prepare(
      `UPDATE agent_rate_limits
       SET expires_at = ?
       WHERE bucket_key = ?`,
    ).run(
      Date.now() - 1,
      consumeBucketKey(userA, bucket),
    );

    const requestAfterExpiry = consumeRateLimit(
      userA,
      bucket,
      limit,
      windowMs,
    );

    const requestAfterExpiryAllowed =
      requestAfterExpiry.allowed &&
      requestAfterExpiry.remaining === 4;

    const passed =
      firstFiveAllowed &&
      sixthRequestRejected &&
      retryAfterReturned &&
      independentUserAllowed &&
      remainingCorrect &&
      requestAfterExpiryAllowed;

    console.log("\n--- RATE LIMITER TEST ---");

    console.log({
      firstFiveAllowed,
      sixthRequestRejected,
      retryAfterReturned,
      independentUserAllowed,
      remainingCorrect,
      requestAfterExpiryAllowed,
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

// Reproduce the rate limiter's HMAC key for test-only expiry simulation.
import { createHmac } from "node:crypto";

function consumeBucketKey(userId: string, bucket: string): string {
  return createHmac(
    "sha256",
    process.env.BETTER_AUTH_SECRET!,
  )
    .update(`${userId}:${bucket}`)
    .digest("hex");
}

main().catch((error) => {
  console.error("RATE LIMITER TEST FAILED:", error);
  process.exitCode = 1;
});
