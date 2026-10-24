
import assert from "node:assert/strict";

import { db } from "./agent/runtime/database";

import {
  resolveIssueForInvestigation,
  upsertIssue,
  getIssueById,
  updateIssueStatusForInvestigation,
} from "./agent/issue-store";

function resetIssues() {
  db.prepare("DELETE FROM agent_issues").run();
}

function test(name: string, run: () => void) {
  try {
    run();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

try {
  resetIssues();

  const issue = upsertIssue({
    apiPath: "/api/test-resolution",
    investigationId: "investigation-current",
    bottleneck: {
      name: "Database query",
      duration: 2500,
      percentage: 80,
    },
  });

  updateIssueStatusForInvestigation(
    "investigation-current",
    "investigating",
  );

  test("current investigation can resolve its issue", () => {
    const resolved = resolveIssueForInvestigation(
      issue.id,
      "investigation-current",
    );

    assert.equal(resolved?.status, "resolved");
  });

  resetIssues();

  const staleIssue = upsertIssue({
    apiPath: "/api/test-stale-resolution",
    investigationId: "investigation-old",
    bottleneck: {
      name: "Slow query",
      duration: 3000,
      percentage: 75,
    },
  });

  updateIssueStatusForInvestigation(
    "investigation-old",
    "investigating",
  );

  // A newer investigation becomes the owner of the issue.
  upsertIssue({
    apiPath: "/api/test-stale-resolution",
    investigationId: "investigation-new",
    bottleneck: {
      name: "Slow query",
      duration: 3000,
      percentage: 75,
    },
  });

  updateIssueStatusForInvestigation(
    "investigation-new",
    "investigating",
  );

  test("older investigation cannot resolve a newer issue", () => {
    const resolved = resolveIssueForInvestigation(
      staleIssue.id,
      "investigation-old",
    );

    assert.equal(resolved, null);

    const current = getIssueById(staleIssue.id);

    assert.equal(
      current?.latestInvestigationId,
      "investigation-new",
    );

    assert.equal(current?.status, "investigating");
  });

  test("already-resolved issue cannot be resolved again", () => {
    const resolved = resolveIssueForInvestigation(
      staleIssue.id,
      "investigation-new",
    );

    assert.equal(resolved?.status, "resolved");

    const repeated = resolveIssueForInvestigation(
      staleIssue.id,
      "investigation-new",
    );

    assert.equal(repeated, null);
  });

  test("missing issue is rejected", () => {
    const result = resolveIssueForInvestigation(
      "missing-issue-id",
      "investigation-current",
    );

    assert.equal(result, null);
  });

  console.log("\nAll 4 issue-resolution tests passed.");
} finally {
  // Clean only the isolated test database.
  resetIssues();
  db.close();
}
