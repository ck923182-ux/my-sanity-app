"use client";

import { useEffect, useState } from "react";

type RequestLog = {
  id: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  timestamp: string;
  userAgent?: string;
};

type LogsResponse = {
  total: number;
  logs: RequestLog[];
};

function StatusBadge({ status }: { status: number }) {
  const isSuccess = status >= 200 && status < 300;
  const isRedirect = status >= 300 && status < 400;

  if (isSuccess) {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        {status}
      </span>
    );
  }

  if (isRedirect) {
    return (
      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
        {status}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
      {status}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
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
        styles[method] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {method}
    </span>
  );
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString();
}

function durationClass(duration: number) {
  if (duration >= 1000) {
    return "text-red-600";
  }

  if (duration >= 500) {
    return "text-orange-600";
  }

  return "text-green-600";
}

export default function RequestLogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchLogs() {
    try {
      const response = await fetch("/api/agent/logs", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch request logs");
      }

      const result = await response.json();

      setData(result);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load request logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();

    const interval = setInterval(fetchLogs, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading request logs...
        </p>
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
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">
            Total Requests
          </p>

          <p className="text-xl font-bold text-slate-900">
            {data?.total ?? 0}
          </p>
        </div>
      </div>

      {/* Logs */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-900">
            API Request History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Automatically refreshed every 5 seconds.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-medium text-slate-700">
              No requests recorded yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Call one of your monitored APIs to generate logs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
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
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    {/* Request */}
                    <td className="px-6 py-5">
                      <p className="max-w-[350px] truncate font-medium text-slate-900">
                        {log.path}
                      </p>
                    </td>

                    {/* Method */}
                    <td className="px-6 py-5">
                      <MethodBadge method={log.method} />
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <StatusBadge status={log.status} />
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-5">
                      <span
                        className={`font-semibold ${durationClass(
                          log.duration
                        )}`}
                      >
                        {log.duration} ms
                      </span>
                    </td>

                    {/* Time */}
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {formatTime(log.timestamp)}
                    </td>

                    {/* ID */}
                    <td className="px-6 py-5">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {log.id}
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