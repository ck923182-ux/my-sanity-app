
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const tempDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "issue-rollback-test-"),
  );

  process.env.AGENT_DATABASE_PATH = path.join(
    tempDirectory,
    "test.sqlite",
  );

  let db:
    | typeof import("../agent/runtime/database").db
    | undefined;

  try {
    const database = await import("../agent/runtime/database");
    db = database.db;

    const { upsertIssue, getIssues } = await import(
      "../agent/issue-store"
    );

    // Seed the database with the maximum allowed 500 issues.
    for (let i = 1; i <= 500; i++) {
      upsertIssue({
        apiPath: `/api/test-seed-${i}`,
        investigationId: `seed-investigation-${i}`,
        priority: "medium",
      });
    }

    const countBefore = getIssues().length;

    // Force cleanup to fail when the 501st issue is inserted.
    db.exec(`
      CREATE TRIGGER fail_issue_cleanup
      BEFORE DELETE ON agent_issues
      BEGIN
        SELECT RAISE(ABORT, 'EXPECTED ISSUE CLEANUP FAILURE');
      END;
    `);

    let transactionFailed = false;

    try {
      upsertIssue({
        apiPath: "/api/test-rollback",
        investigationId: "test-investigation-501",
        priority: "high",
        bottleneck: {
          name: "Database query",
          duration: 1500,
          percentage: 75,
        },
      });
    } catch (error) {
      transactionFailed = true;

      console.log("EXPECTED ISSUE TRANSACTION FAILURE:", {
        errorName:
          error instanceof Error ? error.name : "UnknownError",
      });
    }

    const issuesAfterFailure = getIssues();

    const originalIssuesPreserved =
      issuesAfterFailure.length === 500 &&
      issuesAfterFailure.some(
        (issue) => issue.apiPath === "/api/test-seed-1",
      ) &&
      issuesAfterFailure.some(
        (issue) => issue.apiPath === "/api/test-seed-500",
      );

    const newIssueRolledBack = !issuesAfterFailure.some(
      (issue) => issue.apiPath === "/api/test-rollback",
    );

    const passed =
      transactionFailed &&
      originalIssuesPreserved &&
      newIssueRolledBack;

    console.log("\n--- ISSUE TRANSACTION ROLLBACK TEST ---");

    console.log({
      transactionFailed,
      originalIssuesPreserved,
      newIssueRolledBack,
      countBefore,
      countAfter: issuesAfterFailure.length,
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
