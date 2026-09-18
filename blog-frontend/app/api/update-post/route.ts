import { NextResponse } from "next/server"
import { writeClient } from "@/lib/sanity-write"
import { withApiMonitoring } from "@/agent/runtime/api-monitor"

export const POST = withApiMonitoring(async (request) => {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required field: id",
        },
        { status: 400 }
      )
    }

    if (!body.title) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required field: title",
        },
        { status: 400 }
      )
    }

   const sanityStart = performance.now();

    const result = await writeClient
      .patch(body.id)
      .set({ title: body.title })
      .commit();

    const sanityDuration = Math.round(
      performance.now() - sanityStart
    );

    console.log(
      "SOURCE ANALYSIS:",
      {
        operation: "Sanity patch commit",
        duration: sanityDuration,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      data: result,
    })
  } catch (error) {
    console.error("update-post error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update post",
      },
      { status: 500 }
    )
  }
})