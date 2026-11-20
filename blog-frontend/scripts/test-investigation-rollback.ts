
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function main() {
  const tempDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "investigation-rollback-test-"),
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

    const {
      addInvestigation,
      getInvestigations,
      getInvestigationById,
      updateInvestigation,
    } = await import("../agent/investigation-store");

    // Seed the database with the maximum allowed 100 investigations.
    for (let i = 1; i <= 100; i++) {
      addInvestigation({
        id: `seed-investigation-${i}`,
        apiPath: `/api/test-seed-${i}`,
        createdAt: i,
        status: "processing",
        taskId: `task-${i}`,
      });
    }

    const countBefore = getInvestigations().length;

    // Force retention cleanup to fail during the 101st insertion.
    db.exec(`
      CREATE TRIGGER fail_investigation_cleanup
      BEFORE DELETE ON agent_investigations
      BEGIN
        SELECT RAISE(ABORT, 'EXPECTED INVESTIGATION CLEANUP FAILURE');
      END;
    `);

    let creationTransactionFailed = false;

    try {
      addInvestigation({
        id: "test-investigation-101",
        apiPath: "/api/test-rollback",
        createdAt: 101,
        status: "processing",
        taskId: "task-101",
      });
    } catch (error) {
      creationTransactionFailed = true;

      console.log("EXPECTED INVESTIGATION CREATION FAILURE:", {
        errorName:
          error instanceof Error ? error.name : "UnknownError",
      });
    }

    const investigationsAfterCreationFailure = getInvestigations();

    const originalInvestigationsPreserved =
      investigationsAfterCreationFailure.length === 100 &&
      investigationsAfterCreationFailure.some(
        (item) => item.id === "seed-investigation-1",
      ) &&
      investigationsAfterCreationFailure.some(
        (item) => item.id === "seed-investigation-100",
      );

    const newInvestigationRolledBack =
      !investigationsAfterCreationFailure.some(
        (item) => item.id === "test-investigation-101",
      );

    // Remove the cleanup trigger before testing updates.
    db.exec("DROP TRIGGER fail_investigation_cleanup");

    // Force an existing investigation update to fail.
    db.exec(`
      CREATE TRIGGER fail_investigation_update
      BEFORE UPDATE ON agent_investigations
      BEGIN
        SELECT RAISE(ABORT, 'EXPECTED INVESTIGATION UPDATE FAILURE');
      END;
    `);

    const originalInvestigation = getInvestigationById(
      "seed-investigation-100",
    );

    let updateTransactionFailed = false;

    try {
      updateInvestigation("seed-investigation-100", {
        status: "completed",
        error: "This update must be rolled back.",
      });
    } catch (error) {
      updateTransactionFailed = true;

      console.log("EXPECTED INVESTIGATION UPDATE FAILURE:", {
        errorName:
          error instanceof Error ? error.name : "UnknownError",
      });
    }

    const investigationAfterUpdateFailure = getInvestigationById(
      "seed-investigation-100",
    );

    const originalInvestigationPreserved =
      JSON.stringify(investigationAfterUpdateFailure) ===
      JSON.stringify(originalInvestigation);

    const passed =
      creationTransactionFailed &&
      originalInvestigationsPreserved &&
      newInvestigationRolledBack &&
      updateTransactionFailed &&
      originalInvestigationPreserved;

    console.log("\n--- INVESTIGATION TRANSACTION ROLLBACK TEST ---");

    console.log({
      creationTransactionFailed,
      originalInvestigationsPreserved,
      newInvestigationRolledBack,
      updateTransactionFailed,
      originalInvestigationPreserved,
      countBefore,
      countAfterCreationFailure:
        investigationsAfterCreationFailure.length,
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
