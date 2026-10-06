
"use client";

import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/app/components/agent/StatCard";
import InvestigationHistory from "@/app/components/agent/InvestigationHistory"

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

interface InvestigationResponse {
  success: boolean;
  apiPath: string;
  sourceAnalysis?: {
    filePath?: string;
    runtime?: {
      duration: number;
      status: number;
    } | null;
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
  ai?: {
    taskId: string;
    status: "processing";
  };
  message?: string;
}

interface InvestigationAiResponse {
  success: boolean;
  taskId: string;
  status: "processing" | "completed";
  ai?: {
    rootCause: string;
    evidence: string;
    source: string;
    recommendation: string;
    assumptions: string;
  } | null;
  message?: string;
}

export default function AgentDashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [investigationPath, setInvestigationPath] =
    useState("/api/update-post");

  const [investigating, setInvestigating] =
    useState(false);

  const [investigationError, setInvestigationError] =
    useState("");

  const [investigation, setInvestigation] =
    useState<InvestigationResponse | null>(null);

  const [aiDiagnosis, setAiDiagnosis] =
    useState<InvestigationAiResponse["ai"] | null>(
      null
    );

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

  const runInvestigation = async () => {
    const path = investigationPath.trim();

    if (!path) {
      setInvestigationError("API path is required.");
      return;
    }

    setInvestigating(true);
    setInvestigationError("");
    setInvestigation(null);
    setAiDiagnosis(null);

    try {
      const response = await fetch(
        "/api/agent/investigate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path,
          }),
        }
      );

      const data =
        (await response.json()) as InvestigationResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ??
            "Failed to start investigation."
        );
      }

      setInvestigation(data);

      const taskId = data.ai?.taskId;

      if (!taskId) {
        setInvestigating(false);
        return;
      }

      let completed = false;

      for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise((resolve) =>
          setTimeout(resolve, 2000)
        );

        const aiResponse = await fetch(
          `/api/agent/investigate/${taskId}`,
          {
            cache: "no-store",
          }
        );

        const aiData =
          (await aiResponse.json()) as InvestigationAiResponse;

        if (!aiResponse.ok || !aiData.success) {
          throw new Error(
            aiData.message ??
              "Failed to retrieve AI diagnosis."
          );
        }

        if (
          aiData.status === "completed" &&
          aiData.ai
        ) {
          setAiDiagnosis(aiData.ai);
          completed = true;
          break;
        }
      }

      if (!completed) {
        setInvestigationError(
          "AI analysis is still processing. Please try again shortly."
        );
      }
    } catch (error) {
      console.error(
        "Investigation error:",
        error
      );

      setInvestigationError(
        error instanceof Error
          ? error.message
          : "Failed to investigate API."
      );
    } finally {
      setInvestigating(false);
    }
  };

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
            (total, api) =>
              total + api.averageDuration,
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

      {/* AI Investigation */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              AI Investigation
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Analyze an API bottleneck using runtime, source and AI evidence.
            </p>
          </div>
        </div>

        <div className="space-y-6 p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={investigationPath}
              onChange={(event) =>
                setInvestigationPath(
                  event.target.value
                )
              }
              placeholder="/api/update-post"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />

            <button
              type="button"
              onClick={runInvestigation}
              disabled={investigating}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {investigating
                ? "Investigating..."
                : "Investigate API"}
            </button>
          </div>

          {investigationError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {investigationError}
            </div>
          )}

          {investigating && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    AI investigation in progress
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Analyzing source evidence and waiting for Manus AI.
                  </p>
                </div>
              </div>
            </div>
          )}

          {investigation?.sourceAnalysis && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <InvestigationMetric
                  label="Runtime"
                  value={
                    investigation.sourceAnalysis.runtime
                      ? `${investigation.sourceAnalysis.runtime.duration} ms`
                      : "-"
                  }
                />

                <InvestigationMetric
                  label="Bottleneck"
                  value={
                    investigation.sourceAnalysis.bottleneck
                      ? investigation.sourceAnalysis
                          .bottleneck.name
                      : "-"
                  }
                />

                <InvestigationMetric
                  label="Impact"
                  value={
                    investigation.sourceAnalysis.bottleneck
                      ? `${investigation.sourceAnalysis.bottleneck.percentage}%`
                      : "-"
                  }
                />
              </div>

              {investigation.sourceAnalysis.rootCause && (
                <InvestigationPanel
                  title="Root Cause"
                  content={
                    investigation.sourceAnalysis.rootCause
                      .explanation
                  }
                />
              )}

              {investigation.sourceAnalysis.developerRecommendation && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-sm font-semibold text-amber-900">
                      Developer Recommendation
                    </h4>

                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-amber-800">
                      {
                        investigation.sourceAnalysis
                          .developerRecommendation
                          .priority
                      }
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium text-amber-900">
                    {
                      investigation.sourceAnalysis
                        .developerRecommendation.title
                    }
                  </p>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    {
                      investigation.sourceAnalysis
                        .developerRecommendation
                        .recommendation
                    }
                  </p>
                </div>
              )}

              {investigation.sourceAnalysis.sourceContext && (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h4 className="text-sm font-semibold text-slate-800">
                      Source Context
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Lines{" "}
                      {
                        investigation.sourceAnalysis
                          .sourceContext.startLine
                      }
                      -
                      {
                        investigation.sourceAnalysis
                          .sourceContext.endLine
                      }
                    </p>
                  </div>

                  <pre className="overflow-x-auto bg-slate-950 p-4 text-xs leading-6 text-slate-200">
                    <code>
                      {
                        investigation.sourceAnalysis
                          .sourceContext.code
                      }
                    </code>
                  </pre>
                </div>
              )}

              {aiDiagnosis && (
                <div className="rounded-xl border border-slate-300 bg-slate-50">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        AI
                      </span>

                      <div>
                        <h4 className="font-semibold text-slate-900">
                          AI Diagnosis
                        </h4>

                        <p className="text-xs text-slate-500">
                          Manus analysis based on collected evidence
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-5">
                    <AiSection
                      title="Root Cause"
                      content={aiDiagnosis.rootCause}
                    />

                    <AiSection
                      title="Evidence"
                      content={aiDiagnosis.evidence}
                    />

                    <AiSection
                      title="Source"
                      content={aiDiagnosis.source}
                    />

                    <AiSection
                      title="Recommendation"
                      content={aiDiagnosis.recommendation}
                    />

                    <AiSection
                      title="Assumptions"
                      content={aiDiagnosis.assumptions}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <InvestigationHistory />

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

function InvestigationMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InvestigationPanel({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h4 className="text-sm font-semibold text-slate-900">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {content}
      </p>
    </div>
  );
}

function AiSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div>
      <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h5>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {content}
      </p>
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
