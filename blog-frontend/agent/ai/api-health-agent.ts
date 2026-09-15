import type { ApiStats } from "@/agent/types"
import { buildApiHealthPrompt } from "./api-health-prompt"

const MANUS_BASE_URL = "https://api.manus.ai/v2"

export type ApiHealthDiagnosis = {
  severity: "info" | "warning" | "critical"
  diagnosis: string
  recommendation: string
  investigationArea: string
}

function manusHealthHeaders(): HeadersInit {
  const apiKey = process.env.MANUS_API_KEY

  if (!apiKey) {
    throw new Error("MANUS_API_KEY is not set")
  }

  return {
    "Content-Type": "application/json",
    "x-manus-api-key": apiKey,
  }
}

const apiHealthDiagnosisSchema = {
  type: "object",
  properties: {
    severity: {
      type: "string",
      enum: ["info", "warning", "critical"],
    },
    diagnosis: {
      type: "string",
    },
    recommendation: {
      type: "string",
    },
    investigationArea: {
      type: "string",
    },
  },
  required: [
    "severity",
    "diagnosis",
    "recommendation",
    "investigationArea",
  ],
  additionalProperties: false,
}

export async function createApiHealthTask(
  stats: ApiStats
): Promise<{ taskId: string }> {
  const prompt = buildApiHealthPrompt(stats)

  const response = await fetch(`${MANUS_BASE_URL}/task.create`, {
    method: "POST",
    headers: manusHealthHeaders(),
    body: JSON.stringify({
      message: {
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],

        // Health analysis does not need browsing or external connectors.
        connectors: [],
        enable_skills: [],
      },

      // Keep this separate from your content-generation implementation.
      agent_profile: "lite",

      // We need structured JSON for our application.
      structured_output_schema: apiHealthDiagnosisSchema,

      // Health analysis should not appear as normal content-generation work.
      hide_in_task_list: true,

      // Explicitly keep the task private.
      share_visibility: "private",
    }),
  })

  const data = await response.json()

  if (!response.ok || !data.ok) {
    throw new Error(
      data?.error?.message ?? "Failed to create API health task"
    )
  }

  return {
    taskId: data.task_id,
  }
}

export async function getApiHealthDiagnosis(
  taskId: string
): Promise<ApiHealthDiagnosis | null> {
  const response = await fetch(
    `${MANUS_BASE_URL}/task.listMessages?task_id=${encodeURIComponent(
      taskId
    )}&order=desc&limit=20`,
    {
      headers: manusHealthHeaders(),
    }
  )

  const data = await response.json()

  if (!response.ok || !data.ok) {
    throw new Error(
      data?.error?.message ?? "Failed to retrieve API health task"
    )
  }

  const messages: any[] = data.messages ?? []

  const structuredResult = messages.find(
    (message) => message.type === "structured_output_result"
  )

  if (!structuredResult) {
    return null
  }

  const result = structuredResult.structured_output_result

  if (!result.success) {
    throw new Error(
      result.error ?? "API health diagnosis failed"
    )
  }

  return result.value as ApiHealthDiagnosis
}