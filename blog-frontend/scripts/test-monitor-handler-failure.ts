
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const tempDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "agent-handler-failure-test-"),
  );

  process.env.AGENT_DATABASE_PATH = path.join(
    tempDirectory,
    "test.sqlite",
  );

  process.env.BETTER_AUTH_SECRET =
    "phase-9-5-handler-test-secret-123456789";

  let db: typeof import("../agent/runtime/database").db | undefined;

  try {
    const database = await import("../agent/runtime/database");
    db = database.db;

    const { monitorApi } = await import("../agent/runtime/api-monitor");
    const { getRequestLogs } = await import("../agent/store");

    const originalError = new Error("Simulated API handler failure");

    let handlerExecutionCount = 0;
    let capturedError: unknown;

    try {
      await monitorApi(
        new Request("http://localhost/api/test-handler-failure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ test: true }),
        }),
        async () => {
          handlerExecutionCount++;
          throw originalError;
        },
      );
    } catch (error) {
      capturedError = error;
    }

    const logs = getRequestLogs();

    const failedLogs = logs.filter(
      (log) => log.path === "/api/test-handler-failure",
    );

    const passed =
      handlerExecutionCount === 1 &&
      capturedError === originalError &&
      failedLogs.length === 1 &&
      failedLogs[0].status === 500;

    console.log("\n--- API HANDLER FAILURE MONITORING TEST ---");

    console.log({
      handlerExecutionCount,
      originalErrorPreserved: capturedError === originalError,
      totalMonitoringLogs: logs.length,
      failedRequestLogCount: failedLogs.length,
      recordedStatus: failedLogs[0]?.status ?? null,
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
