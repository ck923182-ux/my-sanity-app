
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const tempDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "agent-monitor-test-"),
  );

  process.env.AGENT_DATABASE_PATH = path.join(
    tempDirectory,
    "test.sqlite",
  );

  process.env.BETTER_AUTH_SECRET =
    "phase-9-4-isolated-test-secret-123456789";

  try {
    // Import after setting the isolated database path.
    const { db } = await import("../agent/runtime/database");
    const { monitorApi } = await import("../agent/runtime/api-monitor");
    const { getRequestLogs } = await import("../agent/store");

    // Simulate a database failure during automatic investigation.
    // This affects only the temporary test database.
    db.exec("DROP TABLE agent_issues");

    let handlerExecutionCount = 0;

    const testUrl =
      "http://localhost/api/test-monitor-investigation-failure";

    const responses: Response[] = [];

    // Three requests are needed to reach the automatic-investigation
    // traffic threshold.
    for (let i = 0; i < 3; i++) {
      const response = await monitorApi(
        new Request(testUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attempt: i + 1,
          }),
        }),
        async () => {
          handlerExecutionCount++;

          return Response.json({
            success: true,
            attempt: i + 1,
          });
        },
      );

      responses.push(response);
    }

    const responseBodies = await Promise.all(
      responses.map((response) => response.json()),
    );

    const logs = getRequestLogs();

    const passed =
      handlerExecutionCount === 3 &&
      responses.every((response) => response.status === 200) &&
      responseBodies.every((body) => body.success === true) &&
      logs.length === 3;

    console.log("\n--- AUTOMATIC INVESTIGATION FAILURE TEST ---");

    console.log({
      handlerExecutionCount,
      responseStatuses: responses.map(
        (response) => response.status,
      ),
      logCount: logs.length,
      result: passed ? "PASS" : "FAIL",
    });

    db.close();

    if (!passed) {
      process.exitCode = 1;
    }
  } finally {
    // Remove only the temporary test database and directory.
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
