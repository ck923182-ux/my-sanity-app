
import assert from "node:assert/strict";

type Status = "open" | "investigating" | "resolved";

type Issue = {
  id: string;
  status: Status;
  investigationIds: string[];
  latestInvestigationId: string;
};

function updateStatus(
  issue: Issue,
  investigationId: string,
  status: Status,
): Issue | null {
  // Only the latest investigation should control the issue.
  if (issue.latestInvestigationId !== investigationId) {
    return null;
  }

  return { ...issue, status };
}

const original: Issue = {
  id: "test-issue",
  status: "open",
  investigationIds: ["old-investigation", "new-investigation"],
  latestInvestigationId: "new-investigation",
};

const started = updateStatus(
  original,
  "new-investigation",
  "investigating",
);
assert.equal(started?.status, "investigating");

const failed = updateStatus(
  started!,
  "new-investigation",
  "open",
);
assert.equal(failed?.status, "open");

const resolved = updateStatus(
  started!,
  "new-investigation",
  "resolved",
);
assert.equal(resolved?.status, "resolved");

const staleUpdate = updateStatus(
  original,
  "old-investigation",
  "resolved",
);
assert.equal(staleUpdate, null);

// Confirm the source fixture was never mutated.
assert.equal(original.status, "open");

console.log("PASS: investigation starts");
console.log("PASS: failed investigation reopens issue");
console.log("PASS: successful recovery resolves issue");
console.log("PASS: stale investigation cannot update issue");
console.log("PASS: original test data remains unchanged");
console.log("All 5 lifecycle policy tests passed.");
