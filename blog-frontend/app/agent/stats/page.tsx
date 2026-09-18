"use client";

import { useEffect, useState } from "react";

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
  averageDuration: number;
  maxDuration: number;
  duplicateCalls: number;
  errorRate: number;
  issues: ApiIssue[];
};

type StatsResponse = {
  totalRequests: number;
  stats: ApiStat[];
};

function HealthBadge({ health }: { health: string }) {
  const styles: Record<string, string> = {
    healthy: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[health] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {health}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
        styles[severity] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {severity}
    </span>
  );
}

export default function ApiHealthPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchStats() {
    try {
      const response = await fetch("/api/agent/stats", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch API stats");
      }

      const result: StatsResponse = await response.json();

      setData(result);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load API statistics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading API health...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  const stats = data?.stats ?? [];

  const totalIssues = stats.reduce(
    (total, api) => total + api.issues.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          API Health
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Monitor performance, errors and duplicate requests across your APIs.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Monitored APIs
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Total Requests
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {data?.totalRequests ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Issues Detected
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {totalIssues}
          </p>
        </div>
      </div>

      {/* API Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-900">
            Monitored APIs
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Live API performance metrics.
          </p>
        </div>

        {stats.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No API monitoring data available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">API</th>
                  <th className="px-6 py-4">Health</th>
                  <th className="px-6 py-4">Calls</th>
                  <th className="px-6 py-4">Success</th>
                  <th className="px-6 py-4">Errors</th>
                  <th className="px-6 py-4">Avg Time</th>
                  <th className="px-6 py-4">Max Time</th>
                  <th className="px-6 py-4">Duplicates</th>
                  <th className="px-6 py-4">Error Rate</th>
                  <th className="px-6 py-4">Issues</th>
                </tr>
              </thead>

              <tbody>
                {stats.map((api) => (
                  <tr
                    key={`${api.method}-${api.path}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    {/* API */}
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-medium text-slate-900">
                          {api.path}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {api.method}
                        </p>
                      </div>
                    </td>

                    {/* Health */}
                    <td className="px-6 py-5">
                      <HealthBadge health={api.health} />
                    </td>

                    {/* Calls */}
                    <td className="px-6 py-5 font-medium">
                      {api.totalCalls}
                    </td>

                    {/* Success */}
                    <td className="px-6 py-5 text-green-600">
                      {api.successCalls}
                    </td>

                    {/* Errors */}
                    <td className="px-6 py-5 text-red-600">
                      {api.errorCalls}
                    </td>

                    {/* Average Duration */}
                    <td className="px-6 py-5">
                      {api.averageDuration} ms
                    </td>

                    {/* Max Duration */}
                    <td className="px-6 py-5">
                      {api.maxDuration} ms
                    </td>

                    {/* Duplicate Calls */}
                    <td className="px-6 py-5">
                      {api.duplicateCalls}
                    </td>

                    {/* Error Rate */}
                    <td className="px-6 py-5">
                      {api.errorRate}%
                    </td>

                    {/* Issues */}
                    <td className="px-6 py-5">
                      {api.issues.length > 0 ? (
                        <div className="min-w-[220px] space-y-2">
                          {api.issues.map((issue, index) => (
                            <div
                              key={`${issue.type}-${index}`}
                              className="rounded-lg border border-orange-100 bg-orange-50 p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-orange-800">
                                  {issue.message}
                                </p>

                                <SeverityBadge
                                  severity={issue.severity}
                                />
                              </div>

                              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-orange-500">
                                {issue.type}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-green-600">
                          No issues
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}