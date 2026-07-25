"use server";

// app/admin/generate/actions.ts
//
// Server Actions backing the AI Content Generator form. These run only on
// the server (Next.js strips them from the client bundle), so unlike the
// /api/generate routes, no shared secret is needed here - the action can
// only be invoked from this page's own submitted form/fetch, not called
// directly by an outside client. Swap in a real session check (e.g. via
// next-auth's auth()) once you have authentication wired up, so only
// logged-in authors reach this page in the first place.

import { createManusTask, pollManusTask } from "@/lib/manus";
import {
  generateFormSchema,
  manusPostOutputSchema,
  buildPrompt,
} from "@/lib/schema/aiPostSchema";
import { finalizeGeneratedPost } from "@/lib/finalizeGeneratedPost";

export async function startGeneration(input: unknown) {
  const parsed = generateFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input", issues: parsed.error.issues };
  }

  try {
    const prompt = buildPrompt(parsed.data);
    const task = await createManusTask(prompt, manusPostOutputSchema, {
      projectId: process.env.MANUS_PROJECT_ID,
    });
    return { ok: true as const, taskId: task.task_id, taskUrl: task.task_url };
  } catch (err) {
    console.error("Manus task creation failed:", err);
    return { ok: false as const, error: "Failed to start generation" };
  }
}

export type GenerationStatus =
  | { ok: true; state: "running" }
  | { ok: true; state: "waiting"; description?: string }
  | { ok: true; state: "completed"; draftId: string; studioEditUrl: string }
  | { ok: true; state: "already_created" }
  | { ok: false; error: string };

export async function checkGenerationStatus(
  taskId: string,
  categoryId: string,
  authorId: string
): Promise<GenerationStatus> {
  try {
    const result = await pollManusTask(taskId);

    if (result.status === "running") return { ok: true, state: "running" };
    if (result.status === "waiting") {
      return { ok: true, state: "waiting", description: result.description };
    }
    if (result.status === "error") {
      return { ok: false, error: result.message };
    }

    // completed
    const outcome = await finalizeGeneratedPost(taskId, result.value, categoryId, authorId);
    if (outcome.status === "already_created") return { ok: true, state: "already_created" };
    if (outcome.status === "invalid") return { ok: false, error: "AI output failed validation" };
    if (outcome.status === "save_failed") return { ok: false, error: outcome.message };

    return {
      ok: true,
      state: "completed",
      draftId: outcome.draftId,
      studioEditUrl: `/studio/desk/post;${encodeURIComponent(outcome.draftId)}`,
    };
  } catch (err) {
    console.error("Status check failed:", err);
    return { ok: false, error: "Status check failed" };
  }
}
