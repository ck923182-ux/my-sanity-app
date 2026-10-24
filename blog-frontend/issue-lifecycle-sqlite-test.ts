
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  const testDir = mkdtempSync(join(tmpdir(), "agent-lifecycle-"));
  process.env.AGENT_DATABASE_PATH = join(
    testDir,
    "agent-monitoring.sqlite",
  );

  try {
    // Import only after setting the isolated database path.
    const { db } = await import("./agent/runtime/database");
    const {
      upsertIssue,
      updateIssueStatus,
      updateIssueStatusForInvestigation,
      resolveIssueForInvestigation,
      getIssueById,
    } = await import("./agent/issue-store");

    const first = upsertIssue({
      apiPath: "/api/lifecycle-test",
      investigationId: "investigation-old",
      rootCause: {
        likelyCause: "Test bottleneck",
        explanation: "Integration test",
        duration: 100,
        bottleneckDuration: 100,
        sourceLines: [],
      },
    });

    // The current investigation may start investigating.
    const started = updateIssueStatusForInvestigation(
      "investigation-old",
      "investigating",
    );
    assert.equal(started?.status, "investigating");
    console.log("PASS: current investigation can start");

    // A newer investigation replaces the old one.
    const latest = upsertIssue({
      apiPath: "/api/lifecycle-test",
      investigationId: "investigation-new",
      rootCause: {
        likelyCause: "Test bottleneck",
        explanation: "Integration test",
        duration: 100,
        bottleneckDuration: 100,
        sourceLines: [],
      },
    });

    assert.equal(latest.id, first.id);
    assert.equal(latest.latestInvestigationId, "investigation-new");

    const staleUpdate = updateIssueStatusForInvestigation(
      "investigation-old",
      "resolved",
    );
    assert.equal(staleUpdate, null);
    console.log("PASS: stale investigation cannot update issue");

    // Start the latest investigation, then simulate a manual resolution.
    const currentStarted = updateIssueStatusForInvestigation(
      "investigation-new",
      "investigating",
    );
    assert.equal(currentStarted?.status, "investigating");

    updateIssueStatus(first.id, "resolved");

    const accidentalReopen = updateIssueStatusForInvestigation(
      "investigation-new",
      "investigating",
    );
    assert.equal(accidentalReopen, null);
    assert.equal(getIssueById(first.id)?.status, "resolved");
    console.log("PASS: investigation cannot reopen a resolved issue");

    // Recovery may resolve only a current issue still under investigation.
    updateIssueStatus(first.id, "investigating");

    const resolved = resolveIssueForInvestigation(
      first.id,
      "investigation-new",
    );
    assert.equal(resolved?.status, "resolved");
    console.log("PASS: current investigation can resolve an investigating issue");

    const wrongInvestigation = resolveIssueForInvestigation(
      first.id,
      "investigation-old",
    );
    assert.equal(wrongInvestigation, null);
    console.log("PASS: stale investigation cannot resolve the issue");

    db.close();
    console.log("\nAll 5 SQLite lifecycle integration tests passed.");
  } finally {
    // Clean up only the temporary test database.
    process.env.AGENT_DATABASE_PATH = join(
      testDir,
      "agent-monitoring.sqlite",
    );

    try {
      const { db } = await import("./agent/runtime/database");
      if (db.open) db.close();
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
