
import type { ApiRequestLog } from "./agent/types";
import { evaluateRecoveryLogs } from "./agent/recovery-verifier";

function makeLog(
  id: string,
  status: number,
  duration: number,
  isDuplicate = false,
): ApiRequestLog {
  return {
    id,
    method: "GET",
    path: "/api/recovery-test",
    status,
    duration,
    timestamp: Date.now(),
    isDuplicate,
    duplicateCount: 0,
  };
}

const tests = [
  {
    name: "Fewer than 3 requests",
    logs: [
      makeLog("1", 200, 100),
      makeLog("2", 200, 100),
    ],
    expected: false,
  },
  {
    name: "Three fast successful requests",
    logs: [
      makeLog("3", 200, 100),
      makeLog("4", 200, 150),
      makeLog("5", 204, 200),
    ],
    expected: true,
  },
  {
    name: "Server error present",
    logs: [
      makeLog("6", 200, 100),
      makeLog("7", 500, 100),
      makeLog("8", 200, 100),
    ],
    expected: false,
  },
  {
    name: "Average response time too high",
    logs: [
      makeLog("9", 200, 2500),
      makeLog("10", 200, 2500),
      makeLog("11", 200, 2500),
    ],
    expected: false,
  },
  {
    name: "Duplicate requests do not count",
    logs: [
      makeLog("12", 200, 100),
      makeLog("13", 200, 100, true),
      makeLog("14", 200, 100, true),
    ],
    expected: false,
  },
];

let failed = 0;

for (const test of tests) {
  const result = evaluateRecoveryLogs(test.logs);
  const passed = result.recovered === test.expected;

  console.log(
    `${passed ? "PASS" : "FAIL"}: ${test.name}`,
    {
      expected: test.expected,
      actual: result.recovered,
      totalRequests: result.totalRequests,
      serverErrors: result.serverErrors,
      averageDuration: result.averageDuration,
      reason: result.reason,
    },
  );

  if (!passed) failed++;
}

console.log(`\nResults: ${tests.length - failed}/${tests.length} passed`);

if (failed > 0) {
  process.exitCode = 1;
}
