"use client";

import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/app/components/agent/StatCard";

interface ApiStat {
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
  issues?: string[];
}

interface StatsResponse {
  totalRequests: number;
  stats: ApiStat[];
}

interface RequestLog {
  id: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  timestamp: string;
  userAgent?: string;
}

interface LogsResponse {
  total: number;
  logs: RequestLog[];
}

export default function AgentDashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const [statsResponse, logsResponse] = await Promise.all([
        fetch("/api/agent/stats", {
          cache: "no-store",
        }),
        fetch("/api/agent/logs", {
          cache: "no-store",
        }),
      ]);

      if (!statsResponse.ok || !logsResponse.ok) {
        throw new Error("Failed to load agent data");
      }

      const [statsData, logsData] = await Promise.all([
        statsResponse.json(),
        logsResponse.json(),
      ]);

      setStats(statsData);
      setLogs(logsData);
    } catch (error) {
      console.error("Agent dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 5000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const apiStats = stats?.stats ?? [];
  const requestLogs = logs?.logs ?? [];

  const totalCalls = apiStats.reduce(
    (total, api) => total + api.totalCalls,
    0
  );

  const successCalls = apiStats.reduce(
    (total, api) => total + api.successCalls,
    0
  );

  const errorCalls = apiStats.reduce(
    (total, api) => total + api.errorCalls,
    0
  );

  const averageDuration =
    apiStats.length > 0
      ? Math.round(
          apiStats.reduce(
            (total, api) => total + api.averageDuration,
            0
          ) / apiStats.length
        )
      : 0;

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Overview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Monitor API performance, errors, duplicate requests and AI
          diagnostics.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total API Calls"
          value={totalCalls}
          description={`${apiStats.length} APIs currently monitored`}
          icon="↗"
        />

        <StatCard
          label="Successful Calls"
          value={successCalls}
          description="Requests completed successfully"
          icon="✓"
        />

        <StatCard
          label="Errors"
          value={errorCalls}
          description="Failed API requests"
          icon="!"
        />

        <StatCard
          label="Average Response"
          value={`${averageDuration} ms`}
          description="Average across monitored APIs"
          icon="◷"
        />
      </div>

      {/* API Health */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              API Health
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Current health of monitored endpoints
            </p>
          </div>

          <a
            href="/agent/stats"
            className="text-sm font-medium text-slate-700 hover:text-slate-950"
          >
            View all →
          </a>
        </div>

        {apiStats.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No API requests have been recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 font-medium text-slate-500">
                    Endpoint
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-500">
                    Calls
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-500">
                    Avg. Time
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-500">
                    Errors
                  </th>

                  <th className="px-5 py-3 font-medium text-slate-500">
                    Health
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {apiStats.slice(0, 8).map((api) => (
                  <tr
                    key={`${api.method}-${api.path}`}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          {api.method}
                        </span>

                        <span className="font-medium text-slate-800">
                          {api.path}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {api.totalCalls}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {api.averageDuration} ms
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {api.errorCalls}
                    </td>

                    <td className="px-5 py-4">
                      <HealthBadge health={api.health} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent requests */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              Recent Requests
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Latest requests captured by the monitoring agent
            </p>
          </div>

          <a
            href="/agent/logs"
            className="text-sm font-medium text-slate-700 hover:text-slate-950"
          >
            View logs →
          </a>
        </div>

        {requestLogs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No request logs available.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requestLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-12 text-xs font-semibold text-slate-500">
                    {log.method}
                  </span>

                  <span className="text-sm font-medium text-slate-800">
                    {log.path}
                  </span>
                </div>

                <div className="flex items-center gap-5 text-xs text-slate-500">
                  <span>{log.duration} ms</span>

                  <span
                    className={
                      log.status >= 400
                        ? "font-semibold text-red-600"
                        : "font-semibold text-emerald-600"
                    }
                  >
                    {log.status}
                  </span>

                  <span>
                    {formatTime(log.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HealthBadge({ health }: { health: string }) {
  const normalized = health.toLowerCase();

  if (normalized === "healthy") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Healthy
      </span>
    );
  }

  if (normalized === "critical") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Critical
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Warning
    </span>
  );
}

function formatTime(timestamp: string) {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}