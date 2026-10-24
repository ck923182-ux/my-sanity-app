
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ApiIssue = {
  type: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical" | string;
};

type ApiStat = {
  path: string;
  method: string;
  health: "healthy" | "warning" | "critical" | string;
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  serverErrorCalls: number;
  clientErrorCalls: number;
  averageDuration: number;
  maxDuration: number;
  duplicateCalls: number;
  errorRate: number;
  issues?: ApiIssue[];
};

type StatsResponse = {
  totalRequests: number;
  stats: ApiStat[];
};

function HealthBadge({ health }: { health: string }) {
  const normalized = health.toLowerCase();

  const styles: Record<string, string> = {
    healthy: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        styles[normalized] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {health}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase();

  const styles: Record<string, string> = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
        styles[normalized] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {severity}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export default function ApiHealthPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const requestInProgress = useRef(false);

  const fetchStats = useCallback(async () => {
    if (requestInProgress.current) {
      return;
    }

    requestInProgress.current = true;
    setRefreshing(true);

    try {
      const response = await fetch("/api/agent/stats", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch API statistics (${response.status}).`,
        );
      }

      const result: StatsResponse = await response.json();

      if (
        !result ||
        !Array.isArray(result.stats) ||
        typeof result.totalRequests !== "number"
      ) {
        throw new Error("The API returned an invalid statistics response.");
      }

      // Normalize optional fields so missing issue arrays cannot crash the UI.
      const normalizedResult: StatsResponse = {
        totalRequests: result.totalRequests,
        stats: result.stats.map((api) => ({
          ...api,
          issues: Array.isArray(api.issues) ? api.issues : [],
        })),
      };

      setData(normalizedResult);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      console.error("API statistics error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load API statistics.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      requestInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchStats();

    const interval = setInterval(() => {
      void fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  const stats = data?.stats ?? [];

  const totalIssues = stats.reduce(
    (total, api) => total + (api.issues?.length ?? 0),
    0,
  );

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-200" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>

        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!data && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">
          Unable to load API health
        </h2>
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void fetchStats()}
          disabled={refreshing}
          className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            API Health
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor performance, errors and duplicate requests across your APIs.
          </p>
          <p className="mt-2 text-xs text-slate-500" role="status">
            {refreshing
              ? "Refreshing statistics..."
              : lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : "Waiting for statistics..."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchStats()}
          disabled={refreshing}
          className="self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh now"}
        </button>
      </div>

      {/* Refresh Error: preserve existing data */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-amber-800">
            Refresh failed: {error} Previously loaded data is still displayed.
          </p>
          <button
            type="button"
            onClick={() => void fetchStats()}
            disabled={refreshing}
            className="self-start rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50 sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          label="Monitored APIs"
          value={stats.length}
          description="Endpoints with recorded activity"
        />

        <SummaryCard
          label="Total Requests"
          value={data?.totalRequests ?? 0}
          description="Requests reported by the monitoring API"
        />

        <SummaryCard
          label="Issues Detected"
          value={totalIssues}
          description="Analyzer issues across monitored endpoints"
        />
      </div>

      {/* API Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-900">
            Monitored APIs
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Live performance metrics. Statistics refresh every five seconds.
          </p>
        </div>

        {stats.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No API monitoring data available yet.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Send a request to a monitored endpoint, then check this page again.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-6 py-4">API</th>
                  <th scope="col" className="px-6 py-4">Health</th>
                  <th scope="col" className="px-6 py-4">Calls</th>
                  <th scope="col" className="px-6 py-4">Success</th>
                  <th scope="col" className="px-6 py-4">All Errors</th>
                  <th scope="col" className="px-6 py-4">Server Errors</th>
                  <th scope="col" className="px-6 py-4">Client Errors</th>
                  <th scope="col" className="px-6 py-4">Avg Time</th>
                  <th scope="col" className="px-6 py-4">Max Time</th>
                  <th scope="col" className="px-6 py-4">Duplicates</th>
                  <th scope="col" className="px-6 py-4">Error Rate</th>
                  <th scope="col" className="px-6 py-4">Issues</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {stats.map((api) => {
                  const apiIssues = api.issues ?? [];

                  return (
                    <tr
                      key={`${api.method}-${api.path}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-900">
                          {api.path}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {api.method}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <HealthBadge health={api.health} />
                      </td>

                      <td className="px-6 py-5 font-medium tabular-nums">
                        {api.totalCalls}
                      </td>

                      <td className="px-6 py-5 tabular-nums text-emerald-600">
                        {api.successCalls}
                      </td>

                      <td className="px-6 py-5 tabular-nums text-red-600">
                        {api.errorCalls}
                      </td>

                      <td className="px-6 py-5 tabular-nums text-red-600">
                        {api.serverErrorCalls ?? 0}
                      </td>

                      <td className="px-6 py-5 tabular-nums text-amber-600">
                        {api.clientErrorCalls ?? 0}
                      </td>

                      <td className="px-6 py-5 tabular-nums">
                        {api.averageDuration} ms
                      </td>

                      <td className="px-6 py-5 tabular-nums">
                        {api.maxDuration} ms
                      </td>

                      <td className="px-6 py-5 tabular-nums">
                        {api.duplicateCalls}
                      </td>

                      <td className="px-6 py-5 tabular-nums">
                        {api.errorRate}%
                      </td>

                      <td className="px-6 py-5">
                        {apiIssues.length > 0 ? (
                          <div className="min-w-[220px] space-y-2">
                            {apiIssues.map((issue, index) => (
                              <div
                                key={`${issue.type}-${index}`}
                                className="rounded-lg border border-orange-100 bg-orange-50 p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-semibold text-orange-800">
                                    {issue.message}
                                  </p>
                                  <SeverityBadge severity={issue.severity} />
                                </div>
                                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-orange-500">
                                  {issue.type}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600">
                            No issues
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
