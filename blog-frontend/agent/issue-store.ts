
import { db } from "@/agent/runtime/database";

export type IssueStatus = "open" | "investigating" | "resolved";
export type IssuePriority = "high" | "medium" | "low";

export type IssueHistoryRecord = {
  id: string;
  fingerprint: string;
  apiPath: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  firstDetectedAt: number;
  lastDetectedAt: number;
  occurrenceCount: number;
  reopenedCount?: number;
  investigationIds: string[];
  latestInvestigationId: string;
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
  recommendation?: {
    title: string;
    recommendation: string;
    reason: string;
    sourceLines: number[];
  } | null;
  updatedAt: number;
};

const MAX_ISSUES = 500;

type IssueRow = {
  id: string;
  record_json: string;
};

function readIssueRow(row: IssueRow): IssueHistoryRecord {
  return JSON.parse(row.record_json) as IssueHistoryRecord;
}

function getAllIssues(): IssueHistoryRecord[] {
  const rows = db
    .prepare("SELECT id, record_json FROM agent_issues")
    .all() as IssueRow[];

  return rows.map(readIssueRow);
}

function saveIssue(issue: IssueHistoryRecord): void {
  db.prepare(`
    INSERT INTO agent_issues (
      id,
      fingerprint,
      status,
      latest_investigation_id,
      last_detected_at,
      record_json
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      fingerprint = excluded.fingerprint,
      status = excluded.status,
      latest_investigation_id = excluded.latest_investigation_id,
      last_detected_at = excluded.last_detected_at,
      record_json = excluded.record_json
  `).run(
    issue.id,
    issue.fingerprint,
    issue.status,
    issue.latestInvestigationId,
    issue.lastDetectedAt,
    JSON.stringify(issue),
  );
}

function createFingerprint(
  apiPath: string,
  bottleneckName?: string | null,
  likelyCause?: string | null,
): string {
  const normalizedPath = apiPath.trim().toLowerCase();
  const normalizedProblem = (
    bottleneckName?.trim() ||
    likelyCause?.trim() ||
    "general-api-health"
  )
    .toLowerCase()
    .replace(/\s+/g, " ");

  return `${normalizedPath}::${normalizedProblem}`;
}

function findIssueByInvestigationId(
  investigationId: string,
): IssueHistoryRecord | undefined {
  return getAllIssues().find(
    (issue) =>
      issue.latestInvestigationId === investigationId ||
      issue.investigationIds.includes(investigationId),
  );
}

export function getIssues(): IssueHistoryRecord[] {
  return getAllIssues().sort(
    (a, b) => b.lastDetectedAt - a.lastDetectedAt,
  );
}

export function getIssueById(
  id: string,
): IssueHistoryRecord | undefined {
  const row = db
    .prepare(
      "SELECT id, record_json FROM agent_issues WHERE id = ?",
    )
    .get(id) as IssueRow | undefined;

  return row ? readIssueRow(row) : undefined;
}

export function updateIssueStatus(
  id: string,
  status: IssueStatus,
): IssueHistoryRecord | null {
  return db.transaction(() => {
    const issue = getIssueById(id);
    if (!issue) return null;

    const updated: IssueHistoryRecord = {
      ...issue,
      status,
      updatedAt: Date.now(),
    };

    saveIssue(updated);
    return updated;
  })();
}

export function upsertIssue(input: {
  apiPath: string;
  investigationId: string;
  priority?: IssuePriority;
  bottleneck?: IssueHistoryRecord["bottleneck"];
  rootCause?: IssueHistoryRecord["rootCause"];
  recommendation?: IssueHistoryRecord["recommendation"];
}): IssueHistoryRecord {
  return db.transaction(() => {
    const now = Date.now();

    const fingerprint = createFingerprint(
      input.apiPath,
      input.bottleneck?.name,
      input.rootCause?.likelyCause,
    );

    const existing = getAllIssues().find(
      (issue) => issue.fingerprint === fingerprint,
    );

    if (existing) {
      const alreadyLinked = existing.investigationIds.includes(
        input.investigationId,
      );

      const isReopened =
        existing.status === "resolved" && !alreadyLinked;

      const updated: IssueHistoryRecord = {
        ...existing,
        status: alreadyLinked ? existing.status : "open",
        priority: input.priority ?? existing.priority,
        lastDetectedAt: alreadyLinked
          ? existing.lastDetectedAt
          : now,
        occurrenceCount: alreadyLinked
          ? existing.occurrenceCount
          : existing.occurrenceCount + 1,
        reopenedCount:
          (existing.reopenedCount ?? 0) + (isReopened ? 1 : 0),
        investigationIds: alreadyLinked
          ? existing.investigationIds
          : [
              input.investigationId,
              ...existing.investigationIds,
            ].slice(0, MAX_ISSUES),
        latestInvestigationId: alreadyLinked
          ? existing.latestInvestigationId
          : input.investigationId,
        bottleneck: input.bottleneck ?? existing.bottleneck,
        rootCause: input.rootCause ?? existing.rootCause,
        recommendation:
          input.recommendation ?? existing.recommendation,
        updatedAt: now,
      };

      saveIssue(updated);
      return updated;
    }

    const issue: IssueHistoryRecord = {
      id: crypto.randomUUID(),
      fingerprint,
      apiPath: input.apiPath,
      title: input.bottleneck?.name
        ? `Slow operation: ${input.bottleneck.name}`
        : input.rootCause?.likelyCause ||
          `API issue: ${input.apiPath}`,
      status: "open",
      priority: input.priority ?? "medium",
      firstDetectedAt: now,
      lastDetectedAt: now,
      occurrenceCount: 1,
      reopenedCount: 0,
      investigationIds: [input.investigationId],
      latestInvestigationId: input.investigationId,
      bottleneck: input.bottleneck ?? null,
      rootCause: input.rootCause ?? null,
      recommendation: input.recommendation ?? null,
      updatedAt: now,
    };

    saveIssue(issue);

    // Retain the newest 500 issues, matching the previous store limit.
    db.prepare(`
      DELETE FROM agent_issues
      WHERE id IN (
        SELECT id FROM agent_issues
        ORDER BY last_detected_at DESC, id ASC
        LIMIT -1 OFFSET ?
      )
    `).run(MAX_ISSUES);

    return issue;
  })();
}

export function resolveIssue(
  id: string,
): IssueHistoryRecord | null {
  return updateIssueStatus(id, "resolved");
}

export function getIssueByInvestigationId(
  investigationId: string,
): IssueHistoryRecord | undefined {
  return findIssueByInvestigationId(investigationId);
}

export function resolveIssueForInvestigation(
  id: string,
  investigationId: string,
): IssueHistoryRecord | null {
  return db.transaction(() => {
    const issue = getIssueById(id);
    if (!issue) return null;

    if (
      issue.status !== "investigating" ||
      issue.latestInvestigationId !== investigationId
    ) {
      console.warn("GUARDED ISSUE RESOLUTION SKIPPED:", {
        issueId: id,
        requestedInvestigationId: investigationId,
        latestInvestigationId: issue.latestInvestigationId,
        status: issue.status,
      });

      return null;
    }

    const updated: IssueHistoryRecord = {
      ...issue,
      status: "resolved",
      updatedAt: Date.now(),
    };

    saveIssue(updated);
    return updated;
  })();
}

export function updateIssueStatusForInvestigation(
  investigationId: string,
  status: IssueStatus,
): IssueHistoryRecord | null {
  return db.transaction(() => {
    const issue = findIssueByInvestigationId(investigationId);

    if (!issue) {
      console.warn("ISSUE NOT FOUND FOR INVESTIGATION:", {
        investigationId,
        status,
      });
      return null;
    }

    if (issue.latestInvestigationId !== investigationId) {
      console.warn("STALE INVESTIGATION STATUS UPDATE SKIPPED:", {
        issueId: issue.id,
        requestedInvestigationId: investigationId,
        latestInvestigationId: issue.latestInvestigationId,
        requestedStatus: status,
      });
      return null;
    }

    // Do not let an investigation overwrite a manual or later lifecycle change.
if (
  (status === "investigating" && issue.status === "resolved") ||
  (status === "open" && issue.status !== "investigating") ||
  status === "resolved"
) {
  console.warn("INVALID INVESTIGATION STATUS TRANSITION SKIPPED:", {
    issueId: issue.id,
    investigationId,
    currentStatus: issue.status,
    requestedStatus: status,
  });

  return null;
}

    const updated: IssueHistoryRecord = {
      ...issue,
      status,
      updatedAt: Date.now(),
    };

    saveIssue(updated);
    return updated;
  })();
}
