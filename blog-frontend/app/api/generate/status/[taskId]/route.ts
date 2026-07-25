// app/api/generate/status/[taskId]/route.ts
//
// The frontend polls this route (e.g. every 3s) after POST /api/generate.
// On the poll where Manus reports "completed", it hands off to
// finalizeGeneratedPost() to validate, convert, and save the draft.

import { NextRequest, NextResponse } from "next/server";
import { pollManusTask } from "@/lib/manus";
import { finalizeGeneratedPost } from "@/lib/finalizeGeneratedPost";

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const authHeader = req.headers.get("x-admin-secret");
  if (authHeader !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = params;
  const categoryId = req.nextUrl.searchParams.get("categoryId");
  const authorId = req.nextUrl.searchParams.get("authorId");

  let result;
  try {
    result = await pollManusTask(taskId);
  } catch (err) {
    console.error("Manus poll failed:", err);
    return NextResponse.json({ status: "error", message: "Poll failed" }, { status: 502 });
  }

  if (result.status === "running") {
    return NextResponse.json({ status: "running" });
  }
  if (result.status === "waiting") {
    return NextResponse.json({ status: "waiting", description: result.description });
  }
  if (result.status === "error") {
    return NextResponse.json({ status: "error", message: result.message }, { status: 502 });
  }

  // status === "completed"
  if (!categoryId || !authorId) {
    return NextResponse.json(
      { status: "error", message: "Missing categoryId or authorId" },
      { status: 400 }
    );
  }

  const outcome = await finalizeGeneratedPost(taskId, result.value, categoryId, authorId);

  switch (outcome.status) {
    case "already_created":
      return NextResponse.json({ status: "already_created" });
    case "invalid":
      return NextResponse.json(
        { status: "error", message: "AI output failed validation", issues: outcome.issues },
        { status: 422 }
      );
    case "save_failed":
      return NextResponse.json(
        { status: "error", message: outcome.message },
        { status: 502 }
      );
    case "created":
      return NextResponse.json({
        status: "completed",
        draftId: outcome.draftId,
        studioEditUrl: `/studio/desk/post;${encodeURIComponent(outcome.draftId)}`,
      });
  }
}
