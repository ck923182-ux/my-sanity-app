// app/api/generate/route.ts
//
// Kicks off content generation. Manus is ASYNC, so this route does NOT
// return the finished post — it returns a task_id. The frontend then polls
// GET /api/generate/status/[taskId] until it reports "completed".

import { NextRequest, NextResponse } from "next/server";
import { createManusTask } from "@/lib/manus";
import {
  generateFormSchema,
  manusPostOutputSchema,
  buildPrompt,
} from "@/lib/schema/aiPostSchema";

export async function POST(req: NextRequest) {
  // --- Auth guard -----------------------------------------------------
  // TODO: replace this with real session auth (e.g. NextAuth) before
  // shipping. This endpoint spends Manus credits per call, so it must
  // only be reachable by logged-in authors. As a stopgap, this checks a
  // shared secret so the route isn't wide open while you build real auth.
  const authHeader = req.headers.get("x-admin-secret");
  if (authHeader !== process.env.ADMIN_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = generateFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const prompt = buildPrompt(parsed.data);
    const task = await createManusTask(prompt, manusPostOutputSchema, {
      projectId: process.env.MANUS_PROJECT_ID,
    });

    return NextResponse.json({
      taskId: task.task_id,
      taskUrl: task.task_url,
    });
  } catch (err) {
    console.error("Manus task creation failed:", err);
    return NextResponse.json(
      { error: "Failed to start generation" },
      { status: 502 }
    );
  }
}
