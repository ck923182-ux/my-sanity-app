// lib/manus.ts
//
// Thin wrapper around the Manus API v2 (https://open.manus.ai/docs/v2).
// Manus tasks are ASYNC — task.create returns immediately with a task_id,
// the agent runs in the background, and you poll task.listMessages (or use
// a webhook) until a `structured_output_result` event appears.

const MANUS_BASE_URL = "https://api.manus.ai/v2";

function manusHeaders(): HeadersInit {
  const apiKey = process.env.MANUS_API_KEY;
  if (!apiKey) {
    throw new Error("MANUS_API_KEY is not set in the environment");
  }
  return {
    "Content-Type": "application/json",
    "x-manus-api-key": apiKey,
  };
}

export interface ManusCreateTaskResponse {
  ok: boolean;
  task_id: string;
  task_title: string;
  task_url: string;
}

/**
 * Creates a Manus task and arms a structured_output_schema so the final
 * result is guaranteed to conform to your JSON shape (no free-text parsing).
 *
 * NOTE: structured_output_schema only supports a subset of JSON Schema —
 * no minLength/maxLength/pattern/minimum etc. Enforce those constraints
 * yourself with Zod after you get the value back (see aiPostSchema.ts).
 */
export async function createManusTask(
  prompt: string,
  structuredOutputSchema: Record<string, unknown>,
  options: { projectId?: string } = {}
): Promise<ManusCreateTaskResponse> {
  const res = await fetch(`${MANUS_BASE_URL}/task.create`, {
    method: "POST",
    headers: manusHeaders(),
    body: JSON.stringify({
      message: {
        content: [{ type: "text", text: prompt }],
        // Empty arrays = no connectors, no skills. This is a pure text
        // generation task — without this, the agent may reach for browsing
        // or connected apps by default, which costs more credits and adds
        // latency for something that doesn't need it. Matches the
        // "do not browse the web / use tools" line in instructions.md.
        connectors: [],
        enable_skills: [],
      },
      agent_profile: "manus-1.6",
      hide_in_task_list: false,
      structured_output_schema: structuredOutputSchema,
      // Ties this task to a Manus Project so its shared instructions
      // (style guide, brand voice, etc.) apply automatically.
      ...(options.projectId ? { project_id: options.projectId } : {}),
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data?.error?.message ?? "Failed to create Manus task");
  }
  return data as ManusCreateTaskResponse;
}

export type ManusPollResult =
  | { status: "running" }
  | { status: "waiting"; description?: string }
  | { status: "completed"; value: unknown }
  | { status: "error"; message: string };

/**
 * Polls task.listMessages once and interprets the latest state.
 * Call this on an interval (e.g. every 3s) from your status API route,
 * or from the client, until it returns "completed" or "error".
 */
export async function pollManusTask(taskId: string): Promise<ManusPollResult> {
  const url = `${MANUS_BASE_URL}/task.listMessages?task_id=${encodeURIComponent(
    taskId
  )}&order=desc&limit=20`;

  const res = await fetch(url, { headers: manusHeaders() });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data?.error?.message ?? "Failed to poll Manus task");
  }

  const messages: any[] = data.messages ?? [];

  // The structured_output_result event is what we actually want.
  const structuredResult = messages.find(
    (m) => m.type === "structured_output_result"
  );
  if (structuredResult) {
    const { success, value, error } = structuredResult.structured_output_result;
    if (!success) {
      return { status: "error", message: error ?? "Structured extraction failed" };
    }
    return { status: "completed", value };
  }

  // Otherwise fall back to the latest status_update event.
  const statusUpdate = messages.find((m) => m.type === "status_update");
  const agentStatus = statusUpdate?.status_update?.agent_status;

  if (agentStatus === "error") {
    const errEvent = messages.find((m) => m.type === "error_message");
    return {
      status: "error",
      message: errEvent?.error_message?.content ?? "Manus task failed",
    };
  }
  if (agentStatus === "waiting") {
    return {
      status: "waiting",
      description: statusUpdate?.status_update?.status_detail?.waiting_description,
    };
  }
  // agentStatus === "stopped" but no structured_output_result yet is rare —
  // treat as still running for one more poll.
  return { status: "running" };
}
