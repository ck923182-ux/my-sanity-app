
import assert from "node:assert/strict";

import {
  runAutomaticInvestigation,
} from "./agent/automatic-investigation-runner";

import type {
  ApiHealthResult,
} from "./agent/analyzer/health-analyzer";

import type {
  AutomaticInvestigationDecision,
} from "./agent/automatic-investigation-policy";

// Test-only data. No API or database calls.
const fakeHealth = {
  path: "/api/example",
} as ApiHealthResult;

async function runTests() {
  let passed = 0;

  async function test(
    name: string,
    callback: () => Promise<void>,
  ) {
    await callback();
    passed++;
    console.log(`PASS: ${name}`);
  }

  await test(
    "skips when health data is missing",
    async () => {
      let started = false;

      const result = await runAutomaticInvestigation(
        "/api/example",
        {
          getHealth: () => null,
          decide: () => ({
            shouldInvestigate: true,
            reason: "Test decision",
          }),
          startInvestigation: async () => {
            started = true;
            return { id: "fake-id" };
          },
        },
      );

      assert.equal(result.status, "skipped");
      assert.equal(started, false);
    },
  );

  await test(
    "skips when policy rejects investigation",
    async () => {
      let started = false;

      const decision: AutomaticInvestigationDecision = {
        shouldInvestigate: false,
        reason: "Cooldown is active.",
      };

      const result = await runAutomaticInvestigation(
        "/api/example",
        {
          getHealth: () => fakeHealth,
          decide: () => decision,
          startInvestigation: async () => {
            started = true;
            return { id: "fake-id" };
          },
        },
      );

      assert.deepEqual(result, {
        status: "skipped",
        reason: "Cooldown is active.",
      });

      assert.equal(started, false);
    },
  );

  await test(
    "starts investigation when policy approves",
    async () => {
      let startCount = 0;

      const fakeInvestigation = {
        id: "test-investigation",
      };

      const result = await runAutomaticInvestigation(
        "/api/example",
        {
          getHealth: () => fakeHealth,
          decide: () => ({
            shouldInvestigate: true,
            reason: "Repeated server errors.",
          }),
          startInvestigation: async (apiPath) => {
            startCount++;
            assert.equal(apiPath, "/api/example");
            return fakeInvestigation;
          },
        },
      );

      assert.deepEqual(result, {
        status: "started",
        investigation: fakeInvestigation,
      });

      assert.equal(startCount, 1);
    },
  );

  await test(
    "propagates investigation errors to the caller",
    async () => {
      await assert.rejects(
        () =>
          runAutomaticInvestigation("/api/example", {
            getHealth: () => fakeHealth,
            decide: () => ({
              shouldInvestigate: true,
              reason: "Test failure path.",
            }),
            startInvestigation: async () => {
              throw new Error("Simulated failure");
            },
          }),
        /Simulated failure/,
      );
    },
  );

  console.log(`\nResult: ${passed}/4 tests passed.`);
}

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
