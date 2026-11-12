
import { NextResponse } from "next/server";
import { authorizeAdminApi } from "@/auth/guards";
import { createSourceAnalysisTask } from "@/agent/ai/source-analysis-agent";
import type { SourceAnalysisAiInput } from "@/agent/ai/source-analysis-prompt";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength;
}

function isNumber(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max;
}

function isSourceLines(value: unknown): value is number[] {
  return Array.isArray(value) &&
    value.length <= 200 &&
    value.every(
      (line) =>
        Number.isInteger(line) &&
        line > 0 &&
        line <= 1_000_000,
    );
}

function isValidApiPath(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 200 ||
    !value.startsWith("/api/") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("\\") ||
    value.includes("\0")
  ) {
    return false;
  }

  const segments = value.slice(1).split("/");

  return segments.every(
    (segment) =>
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      /^[a-zA-Z0-9_[\].-]+$/.test(segment),
  );
}

function isValidInput(body: unknown): body is SourceAnalysisAiInput {
  if (!isRecord(body) || !isValidApiPath(body.apiPath)) {
    return false;
  }

  const { runtime, bottleneck, rootCause, developerRecommendation, sourceContext } = body;

  if (
    runtime !== null &&
    (
      !isRecord(runtime) ||
      !isNumber(runtime.duration, 0, 3_600_000) ||
      !Number.isInteger(runtime.status) ||
      !isNumber(runtime.status, 100, 599)
    )
  ) {
    return false;
  }

  if (
    bottleneck !== null &&
    (
      !isRecord(bottleneck) ||
      !isString(bottleneck.name, 200) ||
      !isNumber(bottleneck.duration, 0, 3_600_000) ||
      !isNumber(bottleneck.percentage, 0, 100)
    )
  ) {
    return false;
  }

  if (
    rootCause !== null &&
    (
      !isRecord(rootCause) ||
      !isString(rootCause.likelyCause, 2000) ||
      !isString(rootCause.explanation, 4000) ||
      !isNumber(rootCause.duration, 0, 3_600_000) ||
      !isNumber(rootCause.bottleneckDuration, 0, 3_600_000) ||
      !isSourceLines(rootCause.sourceLines)
    )
  ) {
    return false;
  }

  if (
    developerRecommendation !== null &&
    (
      !isRecord(developerRecommendation) ||
      !["high", "medium", "low"].includes(
        String(developerRecommendation.priority),
      ) ||
      !isString(developerRecommendation.title, 200) ||
      !isString(developerRecommendation.recommendation, 4000) ||
      !isString(developerRecommendation.reason, 2000) ||
      !isSourceLines(developerRecommendation.sourceLines)
    )
  ) {
    return false;
  }

  if (
    sourceContext !== null &&
    (
      !isRecord(sourceContext) ||
      !Number.isInteger(sourceContext.startLine) ||
      !Number.isInteger(sourceContext.endLine) ||
      !isNumber(sourceContext.startLine, 1, 1_000_000) ||
      !isNumber(sourceContext.endLine, 1, 1_000_000) ||
      sourceContext.endLine < sourceContext.startLine ||
      !isString(sourceContext.code, 20_000)
    )
  ) {
    return false;
  }

  return (
    Object.hasOwn(body, "runtime") &&
    Object.hasOwn(body, "bottleneck") &&
    Object.hasOwn(body, "rootCause") &&
    Object.hasOwn(body, "developerRecommendation") &&
    Object.hasOwn(body, "sourceContext")
  );
}

export async function POST(request: Request) {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

  try {
    const body: unknown = await request.json().catch(() => null);

    if (!isValidInput(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid source analysis request.",
        },
        { status: 400 },
      );
    }

    const result = await createSourceAnalysisTask(body);

    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      apiPath: body.apiPath,
      message: "Source analysis AI task created successfully.",
    });
  } catch (error) {
    console.error("Source AI error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create source analysis AI task.",
      },
      { status: 500 },
    );
  }
}
