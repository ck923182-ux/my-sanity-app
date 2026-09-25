import {
  buildSourceAnalysisPrompt,
  type SourceAnalysisAiInput,
} from "./source-analysis-prompt"

const MANUS_BASE_URL =
  "https://api.manus.ai/v2"

export type SourceAnalysisDiagnosis = {
  rootCause: string
  evidence: string
  source: string
  recommendation: string
  assumptions: string
}

function manusSourceHeaders(): HeadersInit {
  const apiKey =
    process.env.MANUS_API_KEY

  if (!apiKey) {
    throw new Error(
      "MANUS_API_KEY is not set"
    )
  }

  return {
    "Content-Type": "application/json",
    "x-manus-api-key": apiKey,
  }
}

const sourceAnalysisDiagnosisSchema = {
  type: "object",

  properties: {
    rootCause: {
      type: "string",
    },

    evidence: {
      type: "string",
    },

    source: {
      type: "string",
    },

    recommendation: {
      type: "string",
    },

    assumptions: {
      type: "string",
    },
  },

  required: [
    "rootCause",
    "evidence",
    "source",
    "recommendation",
    "assumptions",
  ],

  additionalProperties: false,
}

export async function createSourceAnalysisTask(
  input: SourceAnalysisAiInput
): Promise<{ taskId: string }> {
  const prompt =
    buildSourceAnalysisPrompt(input)

  const response = await fetch(
    `${MANUS_BASE_URL}/task.create`,
    {
      method: "POST",

      headers:
        manusSourceHeaders(),

      body: JSON.stringify({
        message: {
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],

          connectors: [],
          enable_skills: [],
        },

        agent_profile: "lite",

        structured_output_schema:
          sourceAnalysisDiagnosisSchema,

        hide_in_task_list: true,

        share_visibility: "private",
      }),
    }
  )

  const data =
    await response.json()

  if (
    !response.ok ||
    !data.ok
  ) {
    throw new Error(
      data?.error?.message ??
        "Failed to create source analysis task"
    )
  }

  return {
    taskId: data.task_id,
  }
}

export async function getSourceAnalysisDiagnosis(
  taskId: string
): Promise<SourceAnalysisDiagnosis | null> {
  const response = await fetch(
    `${MANUS_BASE_URL}/task.listMessages?task_id=${encodeURIComponent(
      taskId
    )}&order=desc&limit=20`,
    {
      headers:
        manusSourceHeaders(),
    }
  )

  const data =
    await response.json()

  if (
    !response.ok ||
    !data.ok
  ) {
    throw new Error(
      data?.error?.message ??
        "Failed to retrieve source analysis task"
    )
  }

  const messages: any[] =
    data.messages ?? []

  const structuredResult =
    messages.find(
      (message) =>
        message.type ===
        "structured_output_result"
    )

  if (!structuredResult) {
    return null
  }

  const result =
    structuredResult
      .structured_output_result

  if (!result.success) {
    throw new Error(
      result.error ??
        "Source analysis diagnosis failed"
    )
  }

  return result.value as SourceAnalysisDiagnosis
}


// /api/update-post
//       ↓
// Runtime monitoring
//       ↓
// Source analysis
//       ↓
// Root cause
//       ↓
// Developer recommendation
//       ↓
// source-analysis-prompt.ts
//       ↓
// source-analysis-agent.ts
//       ↓
// Manus