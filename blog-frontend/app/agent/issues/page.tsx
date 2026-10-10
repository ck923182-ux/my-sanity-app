
"use client";

import { useCallback, useEffect, useState } from "react";

type Issue = {
  id: string;
  apiPath: string;
  title: string;
  status: "open" | "resolved";
  priority: "high" | "medium" | "low";
  firstDetectedAt: number;
  lastDetectedAt: number;
  occurrenceCount: number;
  latestInvestigationId: string;
  bottleneck?: {
    name: string;
    duration: number;
    percentage: number;
  } | null;
  rootCause?: {
    likelyCause: string;
    explanation: string;
  } | null;
  recommendation?: {
    title: string;
    recommendation: string;
  } | null;
};

type IssuesResponse = {
  success: boolean;
  summary: {
    total: number;
    open: number;
    resolved: number;
    recurring: number;
  };
  issues: Issue[];
  error?: string;
};

export default function IssuesPage() {
  const [data, setData] = useState<IssuesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<
    "all" | "open" | "resolved" | "recurring"
  >("all");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadIssues = useCallback(async () => {
    try {
      const response = await fetch("/api/agent/issues", {
        cache: "no-store",
      });

      const result = (await response.json()) as IssuesResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load issues.");
      }

      setData(result);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load issues."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIssues();

    const interval = setInterval(() => {
      void loadIssues();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadIssues]);

  const resolveIssue = async (id: string) => {
    setResolvingId(id);
    setError("");

    try {
      const response = await fetch(
        `/api/agent/issues/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "resolved" }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to resolve issue.");
      }

      await loadIssues();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resolve issue."
      );
    } finally {
      setResolvingId(null);
    }
  };

  const issues = data?.issues ?? [];

  const filteredIssues = issues.filter((issue) => {
    if (filter === "open") return issue.status === "open";
    if (filter === "resolved") return issue.status === "resolved";
    if (filter === "recurring") return issue.occurrenceCount > 1;
    return true;
  });

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Issue History
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track recurring API problems, investigation evidence, and recommended actions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadIssues()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh issues
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Issues" value={data?.summary.total ?? 0} />
        <SummaryCard label="Open Issues" value={data?.summary.open ?? 0} />
        <SummaryCard label="Resolved" value={data?.summary.resolved ?? 0} />
        <SummaryCard label="Recurring Issues" value={data?.summary.recurring ?? 0} />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Detected Issues</h3>
            <p className="mt-1 text-xs text-slate-500">
              Issues are grouped by API path and detected bottleneck.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["open", "Open"],
                ["resolved", "Resolved"],
                ["recurring", "Recurring"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  filter === value
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
              ✓
            </div>
            <h4 className="mt-4 font-medium text-slate-900">
              No issues in this view
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              New issues will appear here when investigations detect a problem.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredIssues.map((issue) => (
              <article key={issue.id} className="space-y-4 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={issue.priority} />
                      <StatusBadge status={issue.status} />
                      {issue.occurrenceCount > 1 && (
                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                          Recurring · {issue.occurrenceCount} occurrences
                        </span>
                      )}
                    </div>

                    <h4 className="mt-3 font-semibold text-slate-900">
                      {issue.title}
                    </h4>
                    <p className="mt-1 break-all font-mono text-sm text-slate-600">
                      {issue.apiPath}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/agent/investigations/${encodeURIComponent(
                        issue.latestInvestigationId
                      )}`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View investigation →
                    </a>

                    {issue.status === "open" && (
                      <button
                        type="button"
                        onClick={() => void resolveIssue(issue.id)}
                        disabled={resolvingId === issue.id}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {resolvingId === issue.id
                          ? "Resolving..."
                          : "Mark resolved"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Detail label="Occurrences" value={String(issue.occurrenceCount)} />
                  <Detail
                    label="Bottleneck"
                    value={issue.bottleneck?.name ?? "Not identified"}
                  />
                  <Detail
                    label="Operation duration"
                    value={
                      issue.bottleneck
                        ? `${issue.bottleneck.duration} ms`
                        : "—"
                    }
                  />
                  <Detail
                    label="Impact"
                    value={
                      issue.bottleneck
                        ? `${issue.bottleneck.percentage}%`
                        : "—"
                    }
                  />
                </div>

                {issue.rootCause && (
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Detected cause
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {issue.rootCause.likelyCause}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {issue.rootCause.explanation}
                    </p>
                  </div>
                )}

                {issue.recommendation && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      {issue.recommendation.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      {issue.recommendation.recommendation}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                  <span>First detected: {formatDate(issue.firstDetectedAt)}</span>
                  <span>Last detected: {formatDate(issue.lastDetectedAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Issue["priority"] }) {
  const styles = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${styles[priority]}`}>
      {priority} priority
    </span>
  );
}

function StatusBadge({ status }: { status: Issue["status"] }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        status === "open"
          ? "bg-blue-50 text-blue-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}
