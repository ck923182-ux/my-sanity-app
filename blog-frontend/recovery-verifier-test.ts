
import assert from "node:assert/strict";
import {
  evaluateRecoveryLogs,
} from "./agent/recovery-verifier";

import type { ApiRequestLog } from "./agent/types";

function makeLog(
  id: string,
  status: number,
  duration: number,
  timestamp: number,
  isDuplicate = false,
): ApiRequestLog {
  return {
    id,
    method: "POST",
    path: "/api/example",
    status,
    duration,
    timestamp,
    isDuplicate,
  };
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

// 1. Three successful, fast, unique requests.
test("three healthy requests confirm recovery", () => {
  const result = evaluateRecoveryLogs([
    makeLog("1", 200, 100, 3000),
    makeLog("2", 200, 150, 2000),
    makeLog("3", 204, 200, 1000),
  ]);

  assert.equal(result.recovered, true);
  assert.equal(result.totalRequests, 3);
  assert.equal(result.serverErrors, 0);
  assert.equal(result.averageDuration, 150);
});

// 2. Duplicate requests must not count toward recovery.
test("duplicate requests do not count", () => {
  const result = evaluateRecoveryLogs([
    makeLog("1", 200, 100, 5000),
    makeLog("2", 200, 100, 4000, true),
    makeLog("3", 200, 100, 3000, true),
  ]);

  assert.equal(result.recovered, false);
  assert.equal(result.totalRequests, 1);
  assert.equal(result.averageDuration, null);
});

// 3. A server error in the recovery window blocks recovery.
test("server errors prevent recovery", () => {
  const result = evaluateRecoveryLogs([
    makeLog("1", 200, 100, 3000),
    makeLog("2", 500, 100, 2000),
    makeLog("3", 200, 100, 1000),
  ]);

  assert.equal(result.recovered, false);
  assert.equal(result.serverErrors, 1);
  assert.equal(result.totalRequests, 3);
});

// 4. Slow responses block recovery.
test("average duration at or above threshold prevents recovery", () => {
  const result = evaluateRecoveryLogs([
    makeLog("1", 200, 2500, 3000),
    makeLog("2", 200, 2500, 2000),
    makeLog("3", 200, 2000, 1000),
  ]);

  assert.equal(result.recovered, false);
  assert.equal(result.averageDuration, 2333);
});

// 5. Only the latest three unique requests determine recovery.
test("latest three unique requests determine recovery", () => {
  const result = evaluateRecoveryLogs([
    makeLog("1", 200, 100, 5000),
    makeLog("2", 200, 100, 4000),
    makeLog("3", 200, 100, 3000),
    makeLog("4", 500, 100, 2000),
  ]);

  assert.equal(result.recovered, true);
  assert.equal(result.totalRequests, 3);
  assert.equal(result.serverErrors, 0);
  assert.equal(result.averageDuration, 100);
});


test("4xx responses prevent recovery", () => {
  const result = evaluateRecoveryLogs([
    makeLog("1", 200, 100, 3000),
    makeLog("2", 404, 100, 2000),
    makeLog("3", 200, 100, 1000),
  ]);

  assert.equal(result.recovered, false);
  assert.equal(result.totalRequests, 3);
  assert.match(result.reason, /non-2xx/);
});

console.log("\nAll 6 recovery-verifier tests passed.");