import { NextResponse } from "next/server"

import {
  getInvestigations,
} from "@/agent/investigation-store"
import { authorizeAdminApi } from "@/auth/guards";

export async function GET() {
    const authError = await authorizeAdminApi();

  if (authError) return authError;
  try {
    const investigations =
      getInvestigations()

    return NextResponse.json({
      success: true,

      total:
        investigations.length,

      investigations,
    })
  } catch (error) {
    console.error(
      "Investigation history error:",
      error
    )

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load investigation history.",
      },
      {
        status: 500,
      }
    )
  }
}