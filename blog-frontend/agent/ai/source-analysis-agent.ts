
import {
  buildSourceAnalysisPrompt,
  type SourceAnalysisAiInput,
} from "./source-analysis-prompt";

import { manusRequest } from "./manus-client";

export type SourceAnalysisDiagnosis = {
  rootCause: string;
  evidence: string;
  source: string;
  recommendation: string;
  assumptions: string;
};

const sourceAnalysisDiagnosisSchema = {
  type: "object",
  properties: {
    rootCause: { type: "string" },
    evidence: { type: "string" },
    source: { type: "string" },
    recommendation: { type: "string" },
    assumptions: { type: "string" },
  },
  required: [
    "rootCause",
    "evidence",
    "source",
    "recommendation",
    "assumptions",
  ],
  additionalProperties: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}


function validateSourceAnalysisDiagnosis(
  value: unknown,
): SourceAnalysisDiagnosis {
  if (!isRecord(value)) {
    throw new Error("Manus returned an invalid source analysis diagnosis.");
  }

  const requiredFields = [
    "rootCause",
    "evidence",
    "source",
    "recommendation",
    "assumptions",
  ] as const;

  if (
    !requiredFields.every(
      (field) =>
        typeof value[field] === "string" &&
        value[field].trim().length > 0,
    )
  ) {
    throw new Error(
      "Manus returned an incomplete source analysis diagnosis.",
    );
  }

  return {
    rootCause: value.rootCause as string,
    evidence: value.evidence as string,
    source: value.source as string,
    recommendation: value.recommendation as string,
    assumptions: value.assumptions as string,
  };
}


export async function createSourceAnalysisTask(
  input: SourceAnalysisAiInput,
): Promise<{ taskId: string }> {
  const prompt = buildSourceAnalysisPrompt(input);

  const data = await manusRequest("task.create", {
    method: "POST",
    body: JSON.stringify({
      message: {
        content: [{ type: "text", text: prompt }],
        connectors: [],
        enable_skills: [],
      },
      agent_profile: "lite",
      structured_output_schema: sourceAnalysisDiagnosisSchema,
      hide_in_task_list: true,
      share_visibility: "private",
    }),
  });

  if (
    typeof data.task_id !== "string" ||
    data.task_id.trim().length === 0
  ) {
    throw new Error("Manus returned an invalid source analysis task ID.");
  }

  return { taskId: data.task_id };
}

export async function getSourceAnalysisDiagnosis(
  taskId: string,
): Promise<SourceAnalysisDiagnosis | null> {
  const endpoint =
    `task.listMessages?task_id=${encodeURIComponent(taskId)}` +
    "&order=desc&limit=20";

  const data = await manusRequest(endpoint);

  if (!Array.isArray(data.messages)) {
    throw new Error("Manus returned an invalid messages response.");
  }

  const structuredResult = data.messages.find((message: unknown) => {
    return (
      isRecord(message) &&
      message.type === "structured_output_result"
    );
  });

  if (!isRecord(structuredResult)) {
    return null;
  }

  const result = structuredResult.structured_output_result;

  if (!isRecord(result)) {
    throw new Error("Manus returned an invalid structured result.");
  }

  if (result.success !== true) {
    throw new SourceAnalysisTaskFailedError(
      typeof result.error === "string"
        ? result.error
        : "Source analysis diagnosis failed.",
    );
  }

 return validateSourceAnalysisDiagnosis(result.value);
}

export class SourceAnalysisTaskFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceAnalysisTaskFailedError";
  }
}

