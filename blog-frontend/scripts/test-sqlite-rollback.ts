
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { ApiRequestLog } from "../agent/types";

async function main() {
  const tempDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "sqlite-rollback-test-"),
  );

  process.env.AGENT_DATABASE_PATH = path.join(
    tempDirectory,
    "test.sqlite",
  );

  let db: typeof import("../agent/runtime/database").db | undefined;

  try {
    const database = await import("../agent/runtime/database");
    db = database.db;

    const { addRequestLog } = await import("../agent/store");

    const createLog = (
      id: string,
      timestamp: number,
    ): ApiRequestLog => ({
      id,
      method: "GET",
      path: "/api/test-rollback",
      status: 200,
      duration: 10,
      timestamp,
      isDuplicate: false,
      duplicateCount: 0,
      operations: [],
    });

    // Seed the database with the maximum retained log count.
    // Suppress repetitive console messages during setup.
    const originalConsoleLog = console.log;
    console.log = () => {};

    try {
      for (let i = 0; i < 5000; i++) {
        addRequestLog(createLog(`seed-${i}`, 1000 + i));
      }
    } finally {
      console.log = originalConsoleLog;
    }

    // Confirm that the database contains 5,000 logs.
    const countBefore = db
      .prepare("SELECT COUNT(*) AS count FROM api_request_logs")
      .get() as { count: number };

    if (countBefore.count !== 5000) {
      throw new Error(
        `Expected 5000 seed logs, found ${countBefore.count}`,
      );
    }

    // Force the trimming operation to fail.
    db.exec(`
      CREATE TRIGGER fail_log_trim
      BEFORE DELETE ON api_request_logs
      BEGIN
        SELECT RAISE(ABORT, 'Simulated trimming failure');
      END;
    `);

    let transactionFailed = false;

    try {
      // This insertion requires trimming the oldest log.
      addRequestLog(createLog("new-log", 10000));
    } catch (error) {
      transactionFailed = true;

      console.log("EXPECTED TRANSACTION FAILURE:", {
        errorName:
          error instanceof Error ? error.name : "UnknownError",
      });
    }

    const countAfter = db
      .prepare("SELECT COUNT(*) AS count FROM api_request_logs")
      .get() as { count: number };

    const originalExists = Boolean(
      db
        .prepare("SELECT 1 FROM api_request_logs WHERE id = ?")
        .get("seed-0"),
    );

    const latestSeedExists = Boolean(
      db
        .prepare("SELECT 1 FROM api_request_logs WHERE id = ?")
        .get("seed-4999"),
    );

    const newLogExists = Boolean(
      db
        .prepare("SELECT 1 FROM api_request_logs WHERE id = ?")
        .get("new-log"),
    );

    const passed =
      transactionFailed &&
      countAfter.count === 5000 &&
      originalExists &&
      latestSeedExists &&
      !newLogExists;

    console.log("\n--- SQLITE TRANSACTION ROLLBACK TEST ---");
    console.log({
      transactionFailed,
      originalLogPreserved: originalExists,
      latestSeedPreserved: latestSeedExists,
      newLogRolledBack: !newLogExists,
      countBefore: countBefore.count,
      countAfter: countAfter.count,
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
  console.error("TEST EXECUTION FAILED:", error);
  process.exitCode = 1;
});
