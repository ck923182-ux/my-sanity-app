
import { NextResponse } from "next/server";

import { createInvestigation } from "@/agent/investigation-service";
import { authorizeAdminApi } from "@/auth/guards";

const API_PATH_REGEX = /^\/api\/[a-zA-Z0-9/_-]+$/;

export async function POST(request: Request) {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body.",
        },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("path" in body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid API path is required.",
        },
        { status: 400 },
      );
    }

    const apiPath = body.path;

    if (
      typeof apiPath !== "string" ||
      apiPath.length > 200 ||
      !API_PATH_REGEX.test(apiPath)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid API path. Provide a valid local /api/... route.",
        },
        { status: 400 },
      );
    }

    const result = await createInvestigation(
      apiPath,
      request.url,
    );

    return NextResponse.json({
      success: true,
      investigationId: result.investigationId,
      apiPath: result.apiPath,

      sourceAnalysis: {
        filePath: result.sourceAnalysis.filePath,
        runtime: result.sourceAnalysis.runtime,
        bottleneck: result.sourceAnalysis.bottleneck,
        rootCause: result.sourceAnalysis.rootCause,
        developerRecommendation:
          result.sourceAnalysis.developerRecommendation,
        sourceContext: result.sourceAnalysis.sourceContext,
      },

      ai: {
        taskId: result.taskId,
        status: "processing",
      },

      message: "API investigation started successfully.",
    });
  } catch (error) {
    console.error("Investigation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to start API investigation.",
      },
      { status: 500 },
    );
  }
}
