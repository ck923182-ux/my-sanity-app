"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type Investigation = {
  id: string
  apiPath: string
  createdAt: number
  status: "processing" | "completed" | "failed"
  taskId?: string

  sourceAnalysis?: {
    filePath?: string

    runtime?: {
      duration: number
      status: number
      timestamp?: number
      operations?: {
        name: string
        duration: number
      }[]
    } | null

    bottleneck?: {
      name: string
      duration: number
      percentage: number
    } | null

    rootCause?: {
      likelyCause: string
      explanation: string
      duration: number
      bottleneckDuration: number
      sourceLines: number[]
    } | null

    developerRecommendation?: {
      priority: "high" | "medium" | "low"
      title: string
      recommendation: string
      reason: string
      sourceLines: number[]
    } | null

    sourceContext?: {
      startLine: number
      endLine: number
      code: string
    } | null
  }

  ai?: {
    rootCause: string
    evidence: string
    source: string
    recommendation: string
    assumptions: string
  } | null
}

type InvestigationResponse = {
  success: boolean
  investigation?: Investigation
  message?: string
}

export default function InvestigationDetailsPage() {
  const params = useParams()
  const router = useRouter()

  const id = params.id as string

  const [
    investigation,
    setInvestigation,
  ] = useState<Investigation | null>(
    null
  )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  async function loadInvestigation() {
    try {
      setLoading(true)
      setError(null)

      const response =
        await fetch(
          `/api/agent/investigations/${id}`,
          {
            cache: "no-store",
          }
        )

      const data =
        (await response.json()) as InvestigationResponse

      if (
        !response.ok ||
        !data.success ||
        !data.investigation
      ) {
        throw new Error(
          data.message ??
            "Failed to load investigation."
        )
      }

      setInvestigation(
        data.investigation
      )
    } catch (error) {
      console.error(
        "Investigation detail error:",
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load investigation."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadInvestigation()
    }
  }, [id])

  function formatDate(
    timestamp: number
  ) {
    return new Date(
      timestamp
    ).toLocaleString()
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">
            Loading investigation...
          </p>
        </div>
      </div>
    )
  }

  if (error || !investigation) {
    return (
      <div className="p-8">
        <div className="rounded-xl border bg-white p-6">
          <h1 className="text-xl font-semibold">
            Investigation
          </h1>

          <p className="mt-4 text-sm text-red-600">
            {error ??
              "Investigation not found."}
          </p>

          <button
            onClick={() =>
              router.back()
            }
            className="mt-6 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  const source =
    investigation.sourceAnalysis

  const runtime =
    source?.runtime

  const bottleneck =
    source?.bottleneck

  const rootCause =
    source?.rootCause

  const recommendation =
    source?.developerRecommendation

  const sourceContext =
    source?.sourceContext

  return (
    <div className="space-y-6 p-8">
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            onClick={() =>
              router.back()
            }
            className="mb-4 text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back to Investigation History
          </button>

          <h1 className="text-2xl font-bold">
            Investigation Details
          </h1>

          <p className="mt-1 text-gray-500">
            {investigation.apiPath}
          </p>
        </div>

        <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
          {investigation.status}
        </span>
      </div>

      {/* Overview */}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            API
          </p>

          <p className="mt-2 font-semibold">
            {investigation.apiPath}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Duration
          </p>

          <p className="mt-2 text-xl font-semibold">
            {runtime
              ? `${runtime.duration}ms`
              : "—"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            HTTP Status
          </p>

          <p className="mt-2 text-xl font-semibold">
            {runtime
              ? runtime.status
              : "—"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Created
          </p>

          <p className="mt-2 text-sm font-semibold">
            {formatDate(
              investigation.createdAt
            )}
          </p>
        </div>
      </div>

      {/* Bottleneck */}

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">
          Bottleneck Analysis
        </h2>

        {bottleneck ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">
                Operation
              </p>

              <p className="mt-1 font-semibold">
                {bottleneck.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Duration
              </p>

              <p className="mt-1 font-semibold">
                {bottleneck.duration}ms
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Request Impact
              </p>

              <p className="mt-1 font-semibold">
                {bottleneck.percentage}%
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            No bottleneck detected.
          </p>
        )}
      </div>

      {/* Operations */}

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">
          Runtime Operations
        </h2>

        {runtime?.operations &&
        runtime.operations.length > 0 ? (
          <div className="mt-4 space-y-3">
            {runtime.operations.map(
              (operation, index) => (
                <div
                  key={`${operation.name}-${index}`}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                >
                  <span className="font-medium">
                    {operation.name}
                  </span>

                  <span className="font-semibold">
                    {operation.duration}ms
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            No runtime operations available.
          </p>
        )}
      </div>

      {/* Root Cause */}

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">
          Root Cause
        </h2>

        {rootCause ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                Likely Cause
              </p>

              <p className="mt-1 font-semibold">
                {rootCause.likelyCause}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Explanation
              </p>

              <p className="mt-1 text-sm leading-6">
                {rootCause.explanation}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Source Lines
              </p>

              <p className="mt-1 text-sm font-medium">
                {rootCause.sourceLines.join(
                  ", "
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Root cause analysis is not available.
          </p>
        )}
      </div>

      {/* Developer Recommendation */}

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">
          Developer Recommendation
        </h2>

        {recommendation ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase text-red-700">
                {recommendation.priority}
              </span>

              <h3 className="font-semibold">
                {recommendation.title}
              </h3>
            </div>

            <p className="text-sm leading-6">
              {recommendation.recommendation}
            </p>

            <div>
              <p className="text-sm text-gray-500">
                Reason
              </p>

              <p className="mt-1 text-sm">
                {recommendation.reason}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Source Lines
              </p>

              <p className="mt-1 text-sm font-medium">
                {recommendation.sourceLines.join(
                  ", "
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            No developer recommendation available.
          </p>
        )}
      </div>

      {/* Source Context */}

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">
          Source Context
        </h2>

        {sourceContext ? (
          <div className="mt-4">
            <p className="mb-3 text-sm text-gray-500">
              Lines{" "}
              {sourceContext.startLine}–
              {sourceContext.endLine}
            </p>

            <pre className="overflow-x-auto rounded-lg bg-gray-950 p-5 text-sm leading-6 text-white">
              <code>
                {sourceContext.code}
              </code>
            </pre>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Source context is not available.
          </p>
        )}
      </div>

      {/* AI Diagnosis */}

      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            AI Diagnosis
          </h2>

          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
            Manus AI
          </span>
        </div>

        {investigation.ai ? (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="font-semibold">
                Root Cause
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-700">
                {investigation.ai.rootCause}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">
                Evidence
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-700">
                {investigation.ai.evidence}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">
                Source
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-700">
                {investigation.ai.source}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">
                Recommendation
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-700">
                {investigation.ai.recommendation}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">
                Assumptions
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-700">
                {investigation.ai.assumptions}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            AI diagnosis is still processing or is not available.
          </p>
        )}
      </div>

      {/* Investigation ID */}

      <div className="rounded-xl border bg-gray-50 p-4">
        <p className="text-xs text-gray-500">
          Investigation ID
        </p>

        <p className="mt-1 break-all font-mono text-xs">
          {investigation.id}
        </p>
      </div>
    </div>
  )
}