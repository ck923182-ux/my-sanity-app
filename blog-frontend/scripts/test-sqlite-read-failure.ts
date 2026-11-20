
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const tempDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "sqlite-read-failure-test-"),
  );

  process.env.AGENT_DATABASE_PATH = path.join(
    tempDirectory,
    "test.sqlite",
  );

  let db: typeof import("../agent/runtime/database").db | undefined;

  try {
    const database = await import("../agent/runtime/database");
    db = database.db;

    const { getRequestLogs, getRequestLogCount } =
      await import("../agent/store");

    // Remove the table to simulate a database read failure.
    db.exec("DROP TABLE api_request_logs");

    let logsReadFailed = false;
    let countReadFailed = false;

    try {
      getRequestLogs();
    } catch (error) {
      logsReadFailed = true;

      console.log("EXPECTED LOG READ FAILURE:", {
        errorName:
          error instanceof Error ? error.name : "UnknownError",
      });
    }

    try {
      getRequestLogCount();
    } catch (error) {
      countReadFailed = true;

      console.log("EXPECTED COUNT READ FAILURE:", {
        errorName:
          error instanceof Error ? error.name : "UnknownError",
      });
    }

    const passed = logsReadFailed && countReadFailed;

    console.log("\n--- SQLITE READ FAILURE TEST ---");

    console.log({
      logsReadFailed,
      countReadFailed,
      errorsPropagated: passed,
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
