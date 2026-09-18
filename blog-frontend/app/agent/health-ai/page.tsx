"use client"

import { useEffect, useState } from "react"

type ApiHealth = {
  path: string
  method: string
  health: string
  totalCalls: number
  successCalls: number
  errorCalls: number
  averageDuration: number
  maxDuration: number
  errorRate: number
  duplicateCalls: number
  issues: {
    type: string
    message: string
    severity: string
  }[]
}

type DiagnosisData = {
  diagnosis: string
  investigationArea: string
  recommendation: string
  severity: string
} | null

type SourceScanData = {
  success: boolean
  found: boolean
  apiPath?: string
  filePath?: string
  source?: string
  message?: string
}

type DiagnosisResponse = {
  success: boolean
  message?: string
  status?: "running" | "completed"
  taskId?: string
  api?: ApiHealth
  diagnosis?: DiagnosisData
}

function SeverityBadge({
  severity,
}: {
  severity?: string
}) {
  const value = severity?.toLowerCase()

  if (value === "critical") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Critical
      </span>
    )
  }

  if (value === "warning") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        Warning
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {severity || "Unknown"}
    </span>
  )
}

function MetricCard({
  label,
  value,
  unit,
}: {
  label: string
  value: number | string
  unit?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <div className="mt-2 flex items-end gap-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>

        {unit && (
          <span className="mb-1 text-sm text-slate-500">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export default function HealthAiPage() {
  const [data, setData] =
    useState<DiagnosisResponse | null>(null)

  const [sourceScan, setSourceScan] =
    useState<SourceScanData | null>(null)

  const [loading, setLoading] = useState(true)

  const [polling, setPolling] =
    useState(false)

  const [sourceLoading, setSourceLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  // --------------------------------
  // Source Scan
  // --------------------------------

  async function scanSource(apiPath: string) {
    try {
      setSourceLoading(true)
      setSourceScan(null)

      const response = await fetch(
        `/api/agent/source-scan?path=${encodeURIComponent(
          apiPath
        )}`
      )

      const result: SourceScanData =
        await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to scan source"
        )
      }

      setSourceScan(result)
    } catch (error) {
      console.error(
        "Source scan error:",
        error
      )

      setSourceScan({
        success: false,
        found: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to scan source",
      })
    } finally {
      setSourceLoading(false)
    }
  }

  // --------------------------------
  // Start AI Diagnosis
  // --------------------------------

  async function startDiagnosis() {
    try {
      setLoading(true)
      setError("")
      setSourceScan(null)

      const response = await fetch(
        "/api/agent/health-ai"
      )

      const result: DiagnosisResponse =
        await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to start diagnosis"
        )
      }

      setData(result)

      // Existing AI task
      if (
        result.status === "running" &&
        result.taskId
      ) {
        pollDiagnosis(result.taskId)
      }

      // Existing completed diagnosis
      if (
        result.status === "completed" &&
        result.api?.path
      ) {
        await scanSource(result.api.path)
      }
    } catch (error) {
      console.error(
        "Diagnosis error:",
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      )
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------
  // Poll AI Task
  // --------------------------------

  async function pollDiagnosis(
    taskId: string
  ) {
    setPolling(true)

    const maxAttempts = 20

    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt++
    ) {
      try {
        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        )

        const response = await fetch(
          `/api/agent/health-ai/${taskId}`
        )

        const result: DiagnosisResponse =
          await response.json()

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to retrieve diagnosis"
          )
        }

        setData(result)

        if (
          result.status === "completed"
        ) {
          setPolling(false)

          if (result.api?.path) {
            await scanSource(
              result.api.path
            )
          }

          return
        }
      } catch (error) {
        console.error(
          "Diagnosis polling error:",
          error
        )

        setError(
          error instanceof Error
            ? error.message
            : "Failed to retrieve diagnosis"
        )

        setPolling(false)

        return
      }
    }

    setPolling(false)

    setError(
      "Diagnosis is taking longer than expected."
    )
  }

  // --------------------------------
  // Initial Diagnosis
  // --------------------------------

  useEffect(() => {
    startDiagnosis()
  }, [])

  const api = data?.api

  const diagnosis =
    data?.diagnosis

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ================================= */}
        {/* Header */}
        {/* ================================= */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="mb-2 flex flex-wrap items-center gap-3">

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                AI Diagnosis
              </h1>

              {diagnosis && (
                <SeverityBadge
                  severity={
                    diagnosis.severity
                  }
                />
              )}

            </div>

            <p className="text-slate-500">
              Automatically analyze problematic
              APIs and generate diagnostic
              recommendations.
            </p>

          </div>

          <button
            onClick={startDiagnosis}
            disabled={
              loading || polling
            }
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {polling
              ? "Analyzing..."
              : loading
                ? "Starting..."
                : "Run Diagnosis"}
          </button>

        </div>

        {/* ================================= */}
        {/* Error */}
        {/* ================================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ================================= */}
        {/* Loading */}
        {/* ================================= */}

        {loading && !data && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="font-semibold text-slate-800">
              Starting AI diagnosis...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              The agent is checking your API
              health.
            </p>

          </div>
        )}

        {/* ================================= */}
        {/* No Issues */}
        {/* ================================= */}

        {!loading &&
          data &&
          !api &&
          !diagnosis && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-600">
                ✓
              </div>

              <h2 className="text-lg font-bold text-emerald-900">
                No API issues detected
              </h2>

              <p className="mt-1 text-sm text-emerald-700">
                {data.message ||
                  "No warning or critical API found"}
              </p>

            </div>
          )}

        {/* ================================= */}
        {/* AI Running */}
        {/* ================================= */}

        {polling &&
          data?.api && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <div className="flex items-center gap-3">

                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

                <div>

                  <p className="font-semibold text-blue-900">
                    AI agent is analyzing the
                    API...
                  </p>

                  <p className="text-sm text-blue-700">
                    This may take a few seconds.
                  </p>

                </div>

              </div>

            </div>
          )}

        {/* ================================= */}
        {/* API Diagnosis */}
        {/* ================================= */}

        {api && (
          <div className="space-y-6">

            {/* --------------------------------- */}
            {/* Problematic API */}
            {/* --------------------------------- */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Problematic API
                  </p>

                  <div className="flex flex-wrap items-center gap-3">

                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm font-semibold text-slate-800">
                      {api.method}
                    </span>

                    <code className="text-sm font-medium text-slate-700">
                      {api.path}
                    </code>

                  </div>

                </div>

                <SeverityBadge
                  severity={
                    diagnosis?.severity ||
                    api.health
                  }
                />

              </div>

            </section>

            {/* --------------------------------- */}
            {/* Metrics */}
            {/* --------------------------------- */}

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <MetricCard
                label="Average Response"
                value={
                  api.averageDuration
                }
                unit="ms"
              />

              <MetricCard
                label="Maximum Response"
                value={
                  api.maxDuration
                }
                unit="ms"
              />

              <MetricCard
                label="Total Calls"
                value={
                  api.totalCalls
                }
              />

              <MetricCard
                label="Error Rate"
                value={`${api.errorRate}%`}
              />

            </section>

            {/* ================================= */}
            {/* AI Sections */}
            {/* ================================= */}

            {diagnosis && (
              <>
                {/* -------------------------------- */}
                {/* AI Diagnosis */}
                {/* -------------------------------- */}

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-lg">
                      ✦
                    </div>

                    <div>

                      <h2 className="font-bold text-slate-900">
                        AI Diagnosis
                      </h2>

                      <p className="text-sm text-slate-500">
                        What the agent found
                      </p>

                    </div>

                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">

                    <p className="text-sm leading-7 text-slate-700">
                      {diagnosis.diagnosis}
                    </p>

                  </div>

                </section>

                {/* -------------------------------- */}
                {/* Investigation Area */}
                {/* -------------------------------- */}

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">
                      🔍
                    </div>

                    <div>

                      <h2 className="font-bold text-slate-900">
                        Investigation Area
                      </h2>

                      <p className="text-sm text-slate-500">
                        Where the agent recommends
                        looking
                      </p>

                    </div>

                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">

                    <p className="text-sm leading-7 text-blue-900">
                      {
                        diagnosis.investigationArea
                      }
                    </p>

                  </div>

                </section>

                {/* -------------------------------- */}
                {/* Recommendation */}
                {/* -------------------------------- */}

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="mb-5 flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                      💡
                    </div>

                    <div>

                      <h2 className="font-bold text-slate-900">
                        AI Recommendation
                      </h2>

                      <p className="text-sm text-slate-500">
                        Suggested next steps
                      </p>

                    </div>

                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">

                    <p className="whitespace-pre-wrap text-sm leading-7 text-emerald-900">
                      {
                        diagnosis.recommendation
                      }
                    </p>

                  </div>

                </section>
              </>
            )}

            {/* ================================= */}
            {/* Source Scan */}
            {/* ================================= */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-5 flex items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-lg">
                    🔎
                  </div>

                  <div>

                    <h2 className="font-bold text-slate-900">
                      Source Code
                    </h2>

                    <p className="text-sm text-slate-500">
                      Actual source file detected
                      by the agent
                    </p>

                  </div>

                </div>

                {sourceLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">

                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />

                    Scanning...

                  </div>
                )}

              </div>

              {/* Source Found */}

              {sourceScan?.found &&
                sourceScan.source && (
                  <div className="overflow-hidden rounded-xl border border-slate-200">

                    {/* File Header */}

                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                      <code className="text-sm font-medium text-slate-700">
                        {
                          sourceScan.filePath
                        }
                      </code>

                      <span className="w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Found
                      </span>

                    </div>

                    {/* Code */}

                    <div className="max-h-[600px] overflow-auto bg-slate-950 p-5">

                      <pre className="font-mono text-sm leading-7 text-slate-300">

                        {sourceScan.source
                          .split("\n")
                          .map(
                            (
                              line,
                              index
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="flex min-w-max"
                              >

                                <span className="mr-5 inline-block w-8 select-none text-right text-slate-600">
                                  {
                                    index +
                                    1
                                  }
                                </span>

                                <span className="whitespace-pre">
                                  {
                                    line
                                  }
                                </span>

                              </div>
                            )
                          )}

                      </pre>

                    </div>

                  </div>
                )}

              {/* Source Not Found */}

              {sourceScan &&
                !sourceScan.found && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">

                    <p className="font-semibold text-amber-900">
                      Source file not found
                    </p>

                    <p className="mt-1 text-sm text-amber-700">
                      {
                        sourceScan.message ||
                        "The agent could not locate the source file."
                      }
                    </p>

                  </div>
                )}

              {/* Initial Source State */}

              {!sourceScan &&
                !sourceLoading && (
                  <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                    Source scan will run
                    automatically after the AI
                    diagnosis is completed.
                  </div>
                )}

            </section>

            {/* ================================= */}
            {/* Task Information */}
            {/* ================================= */}

            {data.taskId && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div>

                    <p className="text-sm font-semibold text-slate-700">
                      AI Task
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Diagnosis task identifier
                    </p>

                  </div>

                  <code className="break-all rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                    {data.taskId}
                  </code>

                </div>

              </section>
            )}

          </div>
        )}

      </div>
    </div>
  )
}