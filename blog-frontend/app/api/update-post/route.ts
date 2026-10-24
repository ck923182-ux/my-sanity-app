
import { NextResponse } from "next/server"
import { client } from "@/lib/sanity"
import { monitorApi } from "@/agent/runtime/api-monitor"

export async function POST(request: Request) {
  return monitorApi(request, async (operations) => {
    try {
      const body = await request.json()

      const id =
        typeof body?.id === "string" ? body.id.trim() : ""

      const title =
        typeof body?.title === "string" ? body.title.trim() : ""

      if (!id || !title) {
        return NextResponse.json(
          {
            success: false,
            message: "Both id and title are required",
          },
          { status: 400 }
        )
      }

      const result = await operations.measure(
        "sanity.patch.commit",
        async () => {
          return await client
            .patch(id)
            .set({ title })
            .commit()
        }
      )

      return NextResponse.json({
        success: true,
        message: "Post updated successfully",
        data: result,
      })
    } catch (error) {
      console.error("Failed to update post:", error)

      return NextResponse.json(
        {
          success: false,
          message: "Failed to update post",
        },
        { status: 500 }
      )
    }
  })
}
