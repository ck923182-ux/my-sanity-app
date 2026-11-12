
import { NextResponse } from "next/server";

import { getSourceAnalysisDiagnosis } from "@/agent/ai/source-analysis-agent";
import { authorizeAdminApi } from "@/auth/guards";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const authError = await authorizeAdminApi();

  if (authError) return authError;

  try {
    const { taskId } = await context.params;

    if (
      typeof taskId !== "string" ||
      taskId.trim().length === 0 ||
      taskId.length > 200
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task ID.",
        },
        { status: 400 },
      );
    }

    const diagnosis = await getSourceAnalysisDiagnosis(taskId);

    if (!diagnosis) {
      return NextResponse.json({
        success: true,
        taskId,
        status: "processing",
        diagnosis: null,
      });
    }

    return NextResponse.json({
      success: true,
      taskId,
      status: "completed",
      diagnosis,
    });
  } catch (error) {
    console.error("Source AI polling error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve source analysis diagnosis.",
      },
      { status: 500 },
    );
  }
}
