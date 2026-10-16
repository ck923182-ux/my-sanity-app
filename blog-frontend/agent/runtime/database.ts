import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDirectory = path.join(process.cwd(), "data");

fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = path.join(dataDirectory, "agent-monitoring.sqlite");

const globalForDatabase = globalThis as unknown as {
  __agentDatabase?: Database.Database;
};

function createDatabase(): Database.Database {
  const db = new Database(databasePath);

  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");

  db.exec(`
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

      CREATE TABLE IF NOT EXISTS api_request_reservations (
  request_id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reservations_fingerprint_timestamp
  ON api_request_reservations(fingerprint, timestamp);
  `);

  return db;
}

export const db =
  globalForDatabase.__agentDatabase ??
  (globalForDatabase.__agentDatabase = createDatabase());
