import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const testDir = mkdtempSync(join(tmpdir(), "agent-recovery-lifecycle-"));
  process.env.AGENT_DATABASE_PATH = join(
    testDir,
    "agent-monitoring.sqlite",
  );

  let db: { close: () => void; open: boolean } | undefined;

  try {
    // Set the isolated database path before importing database modules.
    const database = await import("./agent/runtime/database");
    db = database.db;

    const { upsertIssue, updateIssueStatusForInvestigation, getIssueById } =
      await import("./agent/issue-store");
    const { addInvestigation } = await import("./agent/investigation-store");
    const { addRequestLog, clearRequestLogs } = await import("./agent/store");
    const { checkApiRecovery } = await import("./agent/recovery-service");

    function setup(
      investigationId: string,
      status: "processing" | "completed" | "failed" = "completed",
    ) {
      clearRequestLogs();

      const apiPath = "/api/recovery-lifecycle-test";
      const startedAt = Date.now() - 100;

      addInvestigation({
        id: investigationId,
        apiPath,
        createdAt: startedAt,
        status,
      });

      const issue = upsertIssue({
        apiPath,
        investigationId,
        rootCause: {
          likelyCause: "Recovery lifecycle test",
          explanation: "Test fixture",
          duration: 100,
          bottleneckDuration: 100,
          sourceLines: [],
        },
      });

      const investigating = updateIssueStatusForInvestigation(
        investigationId,
        "investigating",
      );

      assert.equal(investigating?.status, "investigating");

      return { apiPath, issue, startedAt };
    }

    function addThreeRequests(
      apiPath: string,
      startedAt: number,
      statuses: number[] = [200, 200, 204],
    ) {
      statuses.forEach((status, index) => {
        addRequestLog({
          id: `recovery-log-${index}-${Math.random()}`,
          method: "GET",
          path: apiPath,
          status,
          duration: 100 + index * 50,
          timestamp: startedAt + 10 + index,
          isDuplicate: false,
          duplicateCount: 0,
        });
      });
    }

    // 1. Completed investigation + three healthy requests resolves issue.
    {
      const { apiPath, issue, startedAt } = setup("recovery-success");
      addThreeRequests(apiPath, startedAt);

      checkApiRecovery(apiPath);

      assert.equal(getIssueById(issue.id)?.status, "resolved");
      console.log("PASS: healthy requests resolve the current issue");
    }

    // 2. A 4xx response prevents automatic recovery.
    {
      const { apiPath, issue, startedAt } = setup("recovery-4xx");
      addThreeRequests(apiPath, startedAt, [200, 404, 200]);

      checkApiRecovery(apiPath);

      assert.equal(getIssueById(issue.id)?.status, "investigating");
      console.log("PASS: non-2xx response prevents recovery");
    }

    // 3. A processing investigation cannot trigger recovery.
    {
      const { apiPath, issue, startedAt } = setup(
        "recovery-processing",
        "processing",
      );
      addThreeRequests(apiPath, startedAt);

      checkApiRecovery(apiPath);

      assert.equal(getIssueById(issue.id)?.status, "investigating");
      console.log("PASS: incomplete investigation cannot resolve an issue");
    }

    // 4. Old investigation cannot resolve an issue after a newer one starts.
    {
      const { apiPath, issue, startedAt } = setup("recovery-old");

      addInvestigation({
        id: "recovery-new",
        apiPath,
        createdAt: Date.now(),
        status: "completed",
      });

      const updated = upsertIssue({
        apiPath,
        investigationId: "recovery-new",
        rootCause: {
          likelyCause: "Recovery lifecycle test",
          explanation: "Newer investigation fixture",
          duration: 100,
          bottleneckDuration: 100,
          sourceLines: [],
        },
      });

      assert.equal(updated.id, issue.id);
      assert.equal(updated.latestInvestigationId, "recovery-new");

      // The issue is now open under the newer investigation.
      addThreeRequests(apiPath, startedAt);
      checkApiRecovery(apiPath);

      assert.equal(getIssueById(issue.id)?.status, "open");
      console.log("PASS: stale investigation cannot resolve the newer issue");
    }

    console.log("\nAll 4 recovery lifecycle tests passed.");
  } finally {
    try {
      if (db?.open) db.close();
    } catch {
      // The database may already have been closed.
    }

    delete process.env.AGENT_DATABASE_PATH;
    rmSync(testDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
