
import fs from "node:fs";
import path from "node:path";
import { db } from "@/agent/runtime/database";

const ISSUES_FILE = path.resolve(
  process.cwd(),
  "agent",
  "data",
  "issues.json",
);

const INVESTIGATIONS_FILE = path.resolve(
  process.cwd(),
  "agent",
  "data",
  "investigations.json",
);

const MIGRATION_ID = "json-history-to-sqlite-v1";

type JsonRecord = Record<string, unknown>;

function readJsonArray(filePath: string): JsonRecord[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration source file is missing: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8");

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON in migration source: ${filePath}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected a JSON array in: ${filePath}`);
  }

  return parsed.map((record, index) => {
    if (
      record === null ||
      typeof record !== "object" ||
      Array.isArray(record)
    ) {
      throw new Error(
        `Invalid record at index ${index} in ${filePath}`,
      );
    }

    return record as JsonRecord;
  });
}

function requiredString(
  record: JsonRecord,
  field: string,
  source: string,
): string {
  const value = record[field];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `Invalid "${field}" in ${source} migration record`,
    );
  }

  return value;
}

function requiredNumber(
  record: JsonRecord,
  field: string,
  source: string,
): number {
  const value = record[field];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `Invalid "${field}" in ${source} migration record`,
    );
  }

  return value;
}

export function migrateLegacyHistory(): void {
  const migrate = db.transaction(() => {
    const completed = db
      .prepare(
        `SELECT migration_id
         FROM agent_history_migrations
         WHERE migration_id = ?`,
      )
      .get(MIGRATION_ID);

    if (completed) {
      return;
    }

    // Read and validate both sources before inserting any records.
    // Any error aborts the SQLite transaction.
    const issues = readJsonArray(ISSUES_FILE);
    const investigations = readJsonArray(INVESTIGATIONS_FILE);

    const insertIssue = db.prepare(`
      INSERT OR IGNORE INTO agent_issues (
        id,
        fingerprint,
        status,
        latest_investigation_id,
        last_detected_at,
        record_json
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const issue of issues) {
      const id = requiredString(issue, "id", "issue");
      const fingerprint = requiredString(
        issue,
        "fingerprint",
        "issue",
      );
      const status = requiredString(issue, "status", "issue");
      const latestInvestigationId = requiredString(
        issue,
        "latestInvestigationId",
        "issue",
      );
      const lastDetectedAt = requiredNumber(
        issue,
        "lastDetectedAt",
        "issue",
      );

      insertIssue.run(
        id,
        fingerprint,
        status,
        latestInvestigationId,
        lastDetectedAt,
        JSON.stringify(issue),
      );
    }

    const insertInvestigation = db.prepare(`
      INSERT OR IGNORE INTO agent_investigations (
        id,
        task_id,
        api_path,
        status,
        created_at,
        record_json
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const investigation of investigations) {
      const id = requiredString(
        investigation,
        "id",
        "investigation",
      );
      const apiPath = requiredString(
        investigation,
        "apiPath",
        "investigation",
      );
      const status = requiredString(
        investigation,
        "status",
        "investigation",
      );
      const createdAt = requiredNumber(
        investigation,
        "createdAt",
        "investigation",
      );

      const taskId = investigation.taskId;

      if (taskId !== undefined && typeof taskId !== "string") {
        throw new Error(
          `Invalid "taskId" in investigation ${id}`,
        );
      }

      insertInvestigation.run(
        id,
        taskId ?? null,
        apiPath,
        status,
        createdAt,
        JSON.stringify(investigation),
      );
    }

    db.prepare(`
      INSERT INTO agent_history_migrations (
        migration_id,
        completed_at
      ) VALUES (?, ?)
    `).run(MIGRATION_ID, Date.now());
  });

  migrate();
}
