
import { NextResponse } from "next/server"
import {
  updateIssueStatus,
  type IssueStatus,
} from "@/agent/issue-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

const ALLOWED_STATUSES: IssueStatus[] = [
  "open",
  "investigating",
  "resolved",
]

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => null)

    if (
      !body ||
      typeof body.status !== "string" ||
      !ALLOWED_STATUSES.includes(body.status as IssueStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid status. Use "open", "investigating", or "resolved".',
        },
        { status: 400 }
      )
    }

    const issue = updateIssueStatus(
      id,
      body.status as IssueStatus
    )

    if (!issue) {
      return NextResponse.json(
        {
          success: false,
          error: "Issue not found.",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      issue,
    })
  } catch (error) {
    console.error("Failed to update issue status:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update issue status.",
      },
      { status: 500 }
    )
  }
}
