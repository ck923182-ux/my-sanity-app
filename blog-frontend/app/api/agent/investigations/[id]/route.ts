import { NextResponse } from "next/server"

import {
  getInvestigationById,
} from "@/agent/investigation-store"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Investigation id is required.",
        },
        {
          status: 400,
        }
      )
    }

    const investigation =
      getInvestigationById(id)

    if (!investigation) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Investigation not found: ${id}`,
        },
        {
          status: 404,
        }
      )
    }

    return NextResponse.json({
      success: true,
      investigation,
    })
  } catch (error) {
    console.error(
      "Investigation detail error:",
      error
    )

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load investigation.",
      },
      {
        status: 500,
      }
    )
  }
}