"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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
    } | null

    bottleneck?: {
      name: string
      duration: number
      percentage: number
    } | null

    developerRecommendation?: {
      priority: "high" | "medium" | "low"
      title: string
    } | null
  }

  ai?: {
    rootCause: string
    recommendation: string
  } | null
}

type InvestigationsResponse = {
  success: boolean
  total: number
  investigations: Investigation[]
}

export default function InvestigationHistory() {
  const router = useRouter()

  const [
    investigations,
    setInvestigations,
  ] = useState<Investigation[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  async function loadInvestigations() {
    try {
      setError(null)

      const response =
        await fetch(
          "/api/agent/investigations",
          {
            cache: "no-store",
          }
        )

      const data =
        (await response.json()) as InvestigationsResponse

      if (!response.ok || !data.success) {
        throw new Error(
          "Failed to load investigations."
        )
      }

      setInvestigations(
        data.investigations
      )
    } catch (error) {
      console.error(
        "Investigation history error:",
        error
      )

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load investigations."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvestigations()
  }, [])

  function formatDate(
    timestamp: number
  ) {
    return new Date(
      timestamp
    ).toLocaleString()
  }

  function getStatusClass(
    status: Investigation["status"]
  ) {
    if (status === "completed") {
      return "bg-green-100 text-green-700"
    }

    if (status === "failed") {
      return "bg-red-100 text-red-700"
    }

    return "bg-yellow-100 text-yellow-700"
  }

  function getPriorityClass(
    priority:
      | "high"
      | "medium"
      | "low"
      | undefined
  ) {
    if (priority === "high") {
      return "text-red-600"
    }

    if (priority === "medium") {
      return "text-yellow-600"
    }

    return "text-green-600"
  }

  function handleViewDetails(
    investigationId: string
  ) {
    router.push(
      `/agent/investigations/${investigationId}`
    )
  }

  if (loading) {
    return (
      <section className="mt-8">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">
            Investigation History
          </h2>

          <p className="mt-4 text-sm text-gray-500">
            Loading investigations...
          </p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mt-8">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">
            Investigation History
          </h2>

          <p className="mt-4 text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={loadInvestigations}
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8">
      <div className="rounded-xl border bg-white">
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Investigation History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Previous API investigations and AI diagnoses
              </p>
            </div>

            <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium">
              {investigations.length} investigations
            </div>
          </div>
        </div>

        {investigations.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No investigations found.
          </div>
        ) : (
          <div className="divide-y">
            {investigations.map(
              (investigation) => {
                const runtime =
                  investigation
                    .sourceAnalysis
                    ?.runtime

                const bottleneck =
                  investigation
                    .sourceAnalysis
                    ?.bottleneck

                const priority =
                  investigation
                    .sourceAnalysis
                    ?.developerRecommendation
                    ?.priority

                return (
                  <div
                    key={
                      investigation.id
                    }
                    className="p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-semibold">
                            {investigation.apiPath}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              investigation.status
                            )}`}
                          >
                            {investigation.status}
                          </span>

                          {priority && (
                            <span
                              className={`text-xs font-semibold uppercase ${getPriorityClass(
                                priority
                              )}`}
                            >
                              {priority} priority
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                          {formatDate(
                            investigation.createdAt
                          )}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-6 text-sm">
                          <div>
                            <span className="text-gray-500">
                              Duration
                            </span>

                            <p className="font-medium">
                              {runtime
                                ? `${runtime.duration}ms`
                                : "—"}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">
                              HTTP
                            </span>

                            <p className="font-medium">
                              {runtime
                                ? runtime.status
                                : "—"}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">
                              Bottleneck
                            </span>

                            <p className="font-medium">
                              {bottleneck
                                ? bottleneck.name
                                : "—"}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500">
                              Impact
                            </span>

                            <p className="font-medium">
                              {bottleneck
                                ? `${bottleneck.percentage}%`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleViewDetails(
                            investigation.id
                          )
                        }
                        className="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        )}
      </div>
    </section>
  )
}