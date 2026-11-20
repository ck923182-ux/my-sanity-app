
import type { ApiStats } from "@/agent/types";
import { buildApiHealthPrompt } from "./api-health-prompt";
import { manusRequest } from "./manus-client";

export type ApiHealthDiagnosis = {
  severity: "info" | "warning" | "critical";
  diagnosis: string;
  recommendation: string;
  investigationArea: string;
};

export class ApiHealthTaskFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiHealthTaskFailedError";
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
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}


function validateApiHealthDiagnosis(
  value: unknown,
): ApiHealthDiagnosis {
  if (!isRecord(value)) {
    throw new Error("Manus returned an invalid API health diagnosis.");
  }

  const validSeverity = [
    "info",
    "warning",
    "critical",
  ].includes(String(value.severity));

  const requiredFields = [
    "diagnosis",
    "recommendation",
    "investigationArea",
  ] as const;

  if (
    !validSeverity ||
    !requiredFields.every(
      (field) =>
        typeof value[field] === "string" &&
        value[field].trim().length > 0,
    )
  ) {
    throw new Error("Manus returned an incomplete API health diagnosis.");
  }

  return {
    severity: value.severity as ApiHealthDiagnosis["severity"],
    diagnosis: value.diagnosis as string,
    recommendation: value.recommendation as string,
    investigationArea: value.investigationArea as string,
  };
}


export async function createApiHealthTask(
  stats: ApiStats,
): Promise<{ taskId: string }> {
  const prompt = buildApiHealthPrompt(stats);

  const data = await manusRequest("task.create", {
    method: "POST",
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
      structured_output_schema: apiHealthDiagnosisSchema,
      hide_in_task_list: true,
      share_visibility: "private",
    }),
  });

  if (
    typeof data.task_id !== "string" ||
    data.task_id.trim().length === 0
  ) {
    throw new Error("Manus returned an invalid API health task ID.");
  }

  return {
    taskId: data.task_id,
  };
}

export async function getApiHealthDiagnosis(
  taskId: string,
): Promise<ApiHealthDiagnosis | null> {
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

  if (!structuredResult || !isRecord(structuredResult)) {
    return null;
  }

  const result = structuredResult.structured_output_result;

  if (!isRecord(result)) {
    throw new Error("Manus returned an invalid structured result.");
  }

 if (result.success !== true) {
  throw new ApiHealthTaskFailedError(
    "API health diagnosis failed.",
  );
}

  return validateApiHealthDiagnosis(result.value);
}
