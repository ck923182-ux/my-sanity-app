
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RequestLog = {
  id: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  timestamp: string;
  userAgent?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  duplicateCount?: number;
};

type LogsResponse = {
  total: number;
  logs: RequestLog[];
};

function StatusBadge({ status }: { status: number }) {
  const isSuccess = status >= 200 && status < 300;
  const isRedirect = status >= 300 && status < 400;

  const styles = isSuccess
    ? "bg-green-100 text-green-700"
    : isRedirect
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {Number.isFinite(status) ? status : "Unknown"}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const normalizedMethod = method.toUpperCase();

  const styles: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700",
    POST: "bg-purple-100 text-purple-700",
    PUT: "bg-orange-100 text-orange-700",
    PATCH: "bg-indigo-100 text-indigo-700",
    DELETE: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-md px-2 py-1 text-[11px] font-bold ${
        styles[normalizedMethod] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {normalizedMethod || "UNKNOWN"}
    </span>
  );
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString();
}

function durationClass(duration: number) {
  if (!Number.isFinite(duration)) {
    return "text-slate-500";
  }

  if (duration >= 1000) {
    return "text-red-600";
  }

  if (duration >= 500) {
    return "text-orange-600";
  }

  return "text-green-600";
}

function DuplicateBadge() {
  return (
    <span className="ml-2 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
      Duplicate
    </span>
  );
}

export default function RequestLogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const requestInProgress = useRef(false);

  const fetchLogs = useCallback(async () => {
    // Prevent overlapping requests from manual and automatic refreshes.
    if (requestInProgress.current) {
      return;
    }

    requestInProgress.current = true;
    setRefreshing(true);

    try {
      const response = await fetch("/api/agent/logs", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch logs (${response.status})`);
      }

      const result: unknown = await response.json();

      if (
        !result ||
        typeof result !== "object" ||
        !("total" in result) ||
        !("logs" in result) ||
        typeof result.total !== "number" ||
        !Array.isArray(result.logs)
      ) {
        throw new Error("Invalid request logs response");
      }

      const payload = result as LogsResponse;

      setData({
        total: payload.total,
        logs: payload.logs,
      });

      setError("");
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error("Unable to load request logs:", err);
      setError("Unable to refresh request logs. Please try again.");
    } finally {
      requestInProgress.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();

    const interval = setInterval(() => {
      void fetchLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchLogs]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">
            Loading request logs...
          </p>
        </div>
      </div>
    );
  }

  // If the first fetch failed, show a dedicated retry state.
  // If previous data exists, keep displaying it during refresh failures.
  if (!data && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">
          Could not load request logs
        </h2>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void fetchLogs()}
          disabled={refreshing}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Try again
        </button>
      </div>
    );
  }

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Request Logs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Live history of API requests captured by the monitoring agent.
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {lastUpdated
              ? `Last updated: ${formatTime(lastUpdated)}`
              : "Waiting for the first successful refresh..."}
            {refreshing ? " · Refreshing..." : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchLogs()}
            disabled={refreshing}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Total Requests</p>
            <p className="text-xl font-bold text-slate-900">
              {data?.total ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Non-blocking refresh error */}
      {error && data && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center"
        >
          <p className="text-sm text-amber-800">
            {error} Showing the last successfully loaded data.
          </p>

          <button
            type="button"
            onClick={() => void fetchLogs()}
            disabled={refreshing}
            className="shrink-0 rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          >
            Retry
          </button>
        </div>
      )}

      {/* Request history */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900">
              API Request History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Automatically refreshed every 5 seconds.
            </p>
          </div>

          <span className="text-xs text-slate-500">
            {logs.length} displayed {logs.length === 1 ? "record" : "records"}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <span className="text-xl text-slate-500">↗</span>
            </div>

            <p className="font-medium text-slate-700">
              No requests recorded yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Call one of your monitored APIs to generate logs.
            </p>

            <button
              type="button"
              onClick={() => void fetchLogs()}
              disabled={refreshing}
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Check again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Request</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Request ID</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log, index) => (
                  <tr
                    key={log.id || `${log.path}-${log.timestamp}-${index}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-6 py-5">
                      <div className="max-w-[350px]">
                        <p
                          title={log.path}
                          className="truncate font-medium text-slate-900"
                        >
                          {log.path || "Unknown path"}
                        </p>

                        {log.isDuplicate && (
                          <div>
                            <DuplicateBadge />
                            {typeof log.duplicateCount === "number" &&
                              log.duplicateCount > 1 && (
                                <span className="ml-2 text-xs text-slate-500">
                                  Count: {log.duplicateCount}
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <MethodBadge method={log.method || "UNKNOWN"} />
                    </td>

                    <td className="px-6 py-5">
                      <StatusBadge status={log.status} />
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`font-semibold ${durationClass(log.duration)}`}
                      >
                        {Number.isFinite(log.duration)
                          ? `${log.duration} ms`
                          : "—"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                      {formatTime(log.timestamp)}
                    </td>

                    <td className="px-6 py-5">
                      <code
                        title={log.id}
                        className="inline-block max-w-[180px] truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
                      >
                        {log.id || "—"}
                      </code>
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
