
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const defaultDataDirectory = path.join(process.cwd(), "data");

const databasePath = process.env.AGENT_DATABASE_PATH
  ? path.resolve(process.env.AGENT_DATABASE_PATH)
  : path.join(defaultDataDirectory, "agent-monitoring.sqlite");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const globalForDatabase = globalThis as unknown as {
  __agentDatabase?: Database.Database;
};

function createDatabase(): Database.Database {
  const db = new Database(databasePath);

  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");

  db.exec(`
    -- Existing API request monitoring
    CREATE TABLE IF NOT EXISTS api_request_logs (
      id TEXT PRIMARY KEY,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      user_agent TEXT,
      request_fingerprint TEXT,
      is_duplicate INTEGER NOT NULL DEFAULT 0,
      duplicate_of TEXT,
      duplicate_count INTEGER NOT NULL DEFAULT 0,
      operations_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp
      ON api_request_logs(timestamp);

    CREATE INDEX IF NOT EXISTS idx_api_logs_path_method
      ON api_request_logs(path, method);

    -- Existing duplicate-request reservations
    CREATE TABLE IF NOT EXISTS api_request_reservations (
      request_id TEXT PRIMARY KEY,
      fingerprint TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reservations_fingerprint_timestamp
      ON api_request_reservations(fingerprint, timestamp);

    -- Issue history
    CREATE TABLE IF NOT EXISTS agent_issues (
      id TEXT PRIMARY KEY,
      fingerprint TEXT NOT NULL,
      status TEXT NOT NULL,
      latest_investigation_id TEXT NOT NULL,
      last_detected_at INTEGER NOT NULL,
      record_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_agent_issues_fingerprint
      ON agent_issues(fingerprint);

    CREATE INDEX IF NOT EXISTS idx_agent_issues_latest_investigation
      ON agent_issues(latest_investigation_id);

    CREATE INDEX IF NOT EXISTS idx_agent_issues_status_detected
      ON agent_issues(status, last_detected_at);

    -- Investigation history
    CREATE TABLE IF NOT EXISTS agent_investigations (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      api_path TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      record_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_agent_investigations_task
      ON agent_investigations(task_id);

    CREATE INDEX IF NOT EXISTS idx_agent_investigations_path_created
      ON agent_investigations(api_path, created_at);

    -- One-time data migration tracking
    CREATE TABLE IF NOT EXISTS agent_history_migrations (
      migration_id TEXT PRIMARY KEY,
      completed_at INTEGER NOT NULL
    );
  `);

  return db;
}

export const db =
  globalForDatabase.__agentDatabase ??
  (globalForDatabase.__agentDatabase = createDatabase());
