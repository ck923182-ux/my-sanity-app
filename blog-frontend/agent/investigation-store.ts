
import type { SourceAnalysisDiagnosis } from "@/agent/ai/source-analysis-agent";
import { db } from "@/agent/runtime/database";

export type InvestigationHistoryRecord = {
  id: string;
  apiPath: string;
  createdAt: number;
  status: "processing" | "completed" | "failed";
  taskId?: string;
  sourceAnalysis?: {
    filePath?: string;
    runtime?: { duration: number; status: number } | null;
    bottleneck?: {
      name: string;
      duration: number;
      percentage: number;
    } | null;
    rootCause?: {
      likelyCause: string;
      explanation: string;
      duration: number;
      bottleneckDuration: number;
      sourceLines: number[];
    } | null;
    developerRecommendation?: {
      priority: "high" | "medium" | "low";
      title: string;
      recommendation: string;
      reason: string;
      sourceLines: number[];
    } | null;
    sourceContext?: {
      startLine: number;
      endLine: number;
      code: string;
    } | null;
  };
  ai?: SourceAnalysisDiagnosis | null;
  error?: string;
};

const MAX_INVESTIGATIONS = 100;

type InvestigationRow = {
  id: string;
  record_json: string;
};

function readInvestigationRow(
  row: InvestigationRow,
): InvestigationHistoryRecord {
  return JSON.parse(row.record_json) as InvestigationHistoryRecord;
}

function readAllInvestigations(): InvestigationHistoryRecord[] {
  const rows = db
    .prepare(
      "SELECT id, record_json FROM agent_investigations",
    )
    .all() as InvestigationRow[];

  return rows.map(readInvestigationRow);
}

function saveInvestigation(
  investigation: InvestigationHistoryRecord,
): void {
  db.prepare(`
    INSERT INTO agent_investigations (
      id,
      task_id,
      api_path,
      status,
      created_at,
      record_json
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      task_id = excluded.task_id,
      api_path = excluded.api_path,
      status = excluded.status,
      created_at = excluded.created_at,
      record_json = excluded.record_json
  `).run(
    investigation.id,
    investigation.taskId ?? null,
    investigation.apiPath,
    investigation.status,
    investigation.createdAt,
    JSON.stringify(investigation),
  );
}

export function addInvestigation(
  investigation: InvestigationHistoryRecord,
): InvestigationHistoryRecord {
  return db.transaction(() => {
    saveInvestigation(investigation);

    db.prepare(`
      DELETE FROM agent_investigations
      WHERE id IN (
        SELECT id
        FROM agent_investigations
        ORDER BY created_at DESC, id ASC
        LIMIT -1 OFFSET ?
      )
    `).run(MAX_INVESTIGATIONS);

    return investigation;
  })();
}

export function getInvestigations(): InvestigationHistoryRecord[] {
  return readAllInvestigations().sort(
    (a, b) => b.createdAt - a.createdAt,
  );
}

export function getInvestigationById(
  id: string,
): InvestigationHistoryRecord | undefined {
  const row = db
    .prepare(`
      SELECT id, record_json
      FROM agent_investigations
      WHERE id = ?
    `)
    .get(id) as InvestigationRow | undefined;

  return row ? readInvestigationRow(row) : undefined;
}

export function updateInvestigation(
  id: string,
  updates: Partial<InvestigationHistoryRecord>,
): InvestigationHistoryRecord | null {
  return db.transaction(() => {
    const current = getInvestigationById(id);

    if (!current) {
      console.error("Investigation not found:", id);
      return null;
    }

    const updated: InvestigationHistoryRecord = {
      ...current,
      ...updates,
    };

    saveInvestigation(updated);
    return updated;
  })();
}

export function clearInvestigations(): void {
  db.prepare("DELETE FROM agent_investigations").run();
}
