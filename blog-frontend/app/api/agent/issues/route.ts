
import { NextResponse } from "next/server"

import {
  getIssues,
} from "@/agent/issue-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const issues = getIssues()

    const openIssues = issues.filter(
      (issue) => issue.status === "open"
    )

    const resolvedIssues = issues.filter(
      (issue) => issue.status === "resolved"
    )

    return NextResponse.json({
      success: true,

      summary: {
        total: issues.length,
        open: openIssues.length,
        resolved: resolvedIssues.length,
        recurring: issues.filter(
          (issue) => issue.occurrenceCount > 1
        ).length,
      },

      issues,
    })
  } catch (error) {
    console.error("Failed to load issue history:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load issue history.",
      },
      {
        status: 500,
      }
    )
  }
}
