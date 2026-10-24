
import assert from "node:assert/strict";

import {
  evaluateAutomaticInvestigation,
} from "./agent/automatic-investigation-policy";

import type {
  ApiHealthResult,
} from "./agent/analyzer/health-analyzer";

const baseHealth: ApiHealthResult = {
  path: "/api/update-post",
  method: "POST",
  health: "healthy",
  totalCalls: 5,
  successCalls: 5,
  errorCalls: 0,
  serverErrorCalls: 0,
  clientErrorCalls: 0,
  averageDuration: 300,
  maxDuration: 500,
  errorRate: 0,
  duplicateCalls: 0,
  issues: [],
};

const tests: Array<{
  name: string;
  run: () => void;
}> = [
  {
    name: "Agent APIs are excluded",
    run: () => {
      const result = evaluateAutomaticInvestigation({
        ...baseHealth,
        path: "/api/agent/logs",
        averageDuration: 5000,
      });

      assert.equal(result.shouldInvestigate, false);
      assert.match(result.reason, /Agent API is excluded/);
    },
  },
  {
    name: "Fewer than three requests do not trigger investigation",
    run: () => {
      const result = evaluateAutomaticInvestigation({
        ...baseHealth,
        totalCalls: 2,
        serverErrorCalls: 2,
        errorRate: 100,
      });

      assert.equal(result.shouldInvestigate, false);
      assert.match(result.reason, /at least 3 requests/);
    },
  },
  {
    name: "Recurring server errors trigger investigation",
    run: () => {
      const result = evaluateAutomaticInvestigation({
        ...baseHealth,
        totalCalls: 4,
        successCalls: 2,
        errorCalls: 2,
        serverErrorCalls: 2,
        errorRate: 50,
      });

      assert.equal(result.shouldInvestigate, true);
      assert.match(result.reason, /Recurring server errors/);
    },
  },
  {
    name: "High average latency triggers investigation",
    run: () => {
      const result = evaluateAutomaticInvestigation({
        ...baseHealth,
        averageDuration: 2000,
      });

      assert.equal(result.shouldInvestigate, true);
      assert.match(result.reason, /high response time/i);
    },
  },
  {
    name: "Healthy requests do not trigger investigation",
    run: () => {
      const result = evaluateAutomaticInvestigation(baseHealth);

      assert.equal(result.shouldInvestigate, false);
    },
  },
  {
    name: "An active issue prevents another investigation",
    run: () => {
      const result = evaluateAutomaticInvestigation(
        {
          ...baseHealth,
          averageDuration: 2500,
        },
        { hasActiveIssue: true },
      );

      assert.equal(result.shouldInvestigate, false);
      assert.match(result.reason, /already under investigation/);
    },
  },
  {
    name: "A recent investigation activates the cooldown",
    run: () => {
      const result = evaluateAutomaticInvestigation(
        {
          ...baseHealth,
          serverErrorCalls: 3,
          errorRate: 60,
        },
        { hasRecentInvestigation: true },
      );

      assert.equal(result.shouldInvestigate, false);
      assert.match(result.reason, /recent investigation/);
    },
  },
];

let passed = 0;

for (const test of tests) {
  try {
    test.run();
    passed++;
    console.log(`PASS: ${test.name}`);
  } catch (error) {
    console.error(`FAIL: ${test.name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

console.log(`\n${passed}/${tests.length} policy tests passed.`);
