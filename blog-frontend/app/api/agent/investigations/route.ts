import { NextResponse } from "next/server"

import {
  getInvestigations,
} from "@/agent/investigation-store"

export async function GET() {
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