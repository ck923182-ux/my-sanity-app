
import { NextResponse } from "next/server";

import { resolveIssue } from "@/agent/issue-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);

    if (body?.status !== "resolved") {
      return NextResponse.json(
        {
          success: false,
          error: 'Only status "resolved" is supported.',
        },
        { status: 400 }
      );
    }

    const issue = resolveIssue(id);

    if (!issue) {
      return NextResponse.json(
        {
          success: false,
          error: "Issue not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      issue,
    });
  } catch (error) {
    console.error("Failed to resolve issue:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to resolve issue.",
      },
      { status: 500 }
    );
  }
}
