
import { NextResponse } from "next/server"
import { getIssues } from "@/agent/issue-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const issues = getIssues()

    const open = issues.filter(
      (issue) => issue.status === "open"
    ).length

    const investigating = issues.filter(
      (issue) => issue.status === "investigating"
    ).length

    const resolved = issues.filter(
      (issue) => issue.status === "resolved"
    ).length

    return NextResponse.json({
      success: true,
      summary: {
        total: issues.length,
        open,
        investigating,
        resolved,
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
      { status: 500 }
    )
  }
}
