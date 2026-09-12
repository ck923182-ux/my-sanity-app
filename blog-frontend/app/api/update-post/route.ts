import { NextResponse } from "next/server"
import { client } from "@/lib/sanity"
import { monitorApi } from "@/agent/runtime/api-monitor"

export async function POST(request: Request) {
  return monitorApi(request, async () => {
    try {
      const result = await client
        .patch("715f68a9-c6e4-4ed2-88ea-2e7a54f90f0d")
        .set({
          title: "Chandan Kumar Blog ",
        })
        .commit()

      return NextResponse.json({
        success: true,
        message: "Post updated successfully",
        data: result,
      })
    } catch (error) {
      console.error(error)

      return NextResponse.json(
        {
          success: false,
          message: "Failed to update post",
        },
        {
          status: 500,
        }
      )
    }
  })
}