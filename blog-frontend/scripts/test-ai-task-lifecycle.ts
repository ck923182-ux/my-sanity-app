import assert from "node:assert/strict";

import {
  clearAiStore,
  getAiTaskById,
  saveAiDiagnosis,
  saveAiTask,
  updateAiTaskStatus,
} from "../agent/ai-store";

import type { ApiStats } from "../agent/types";
import type { ApiHealthDiagnosis } from "../agent/ai/api-health-agent";

const stats: ApiStats = {
  path: "/api/test-lifecycle",
  method: "POST",
  totalCalls: 10,
  successCalls: 8,
  errorCalls: 2,
  averageDuration: 1200,
  maxDuration: 2000,
  duplicateCalls: 0,
  errorRate: 20,
  health: "warning",
  issues: ["slow-api"],
};

const diagnosis: ApiHealthDiagnosis = {
  severity: "warning",
  diagnosis: "The API response time is high.",
  recommendation: "Optimize the slow operation.",
  investigationArea: "Database query",
};

function test(name: string, callback: () => void) {
  callback();
  console.log(`PASS: ${name}`);
}

try {
  clearAiStore();

  test("Pending task can become timed_out", () => {
    saveAiTask(stats, "task-timeout");

    const updated = updateAiTaskStatus(
      "task-timeout",
      "timed_out",
      "Task exceeded maximum duration.",
    );

    assert.equal(updated?.status, "timed_out");
  });

  test("Timed-out task cannot become completed", () => {
    const result = saveAiDiagnosis("task-timeout", diagnosis);

    assert.equal(result.status, "timed_out");
    assert.equal(result.diagnosis, undefined);
  });

  test("Pending task can become failed", () => {
    const failedStats = {
      ...stats,
      path: "/api/test-failure",
    };

    saveAiTask(failedStats, "task-failed");

    const updated = updateAiTaskStatus(
      "task-failed",
      "failed",
      "Manus reported task failure.",
    );

    assert.equal(updated?.status, "failed");
  });

  test("Failed task cannot become completed", () => {
    const result = saveAiDiagnosis("task-failed", diagnosis);

    assert.equal(result.status, "failed");
    assert.equal(result.diagnosis, undefined);
  });

  test("Completed task cannot become failed", () => {
    const completedStats = {
      ...stats,
      path: "/api/test-completed",
    };

    saveAiTask(completedStats, "task-completed");
    const completed = saveAiDiagnosis(
      "task-completed",
      diagnosis,
    );

    assert.equal(completed.status, "completed");

    const result = updateAiTaskStatus(
      "task-completed",
      "failed",
      "Late failure response.",
    );

    assert.equal(result?.status, "completed");
    assert.deepEqual(result?.diagnosis, diagnosis);
  });

  test("Timed-out task cannot become failed", () => {
    const result = updateAiTaskStatus(
      "task-timeout",
      "failed",
      "Late failure response.",
    );

    assert.equal(result?.status, "timed_out");
  });

  test("Failed task cannot become timed_out", () => {
    const result = updateAiTaskStatus(
      "task-failed",
      "timed_out",
      "Late timeout response.",
    );

    assert.equal(result?.status, "failed");
  });

  test("New task can be created after previous task fails", () => {
    const retryStats = {
      ...stats,
      path: "/api/test-retry",
    };

    saveAiTask(retryStats, "task-old");
    updateAiTaskStatus("task-old", "failed", "Previous task failed.");

    const newTask = saveAiTask(retryStats, "task-new");

    assert.equal(newTask.taskId, "task-new");
    assert.equal(newTask.status, "pending");
    assert.equal(getAiTaskById("task-old"), undefined);
    assert.equal(getAiTaskById("task-new")?.status, "pending");
  });

  console.log("\nAll AI task lifecycle tests passed.");
} finally {
  clearAiStore();
}
