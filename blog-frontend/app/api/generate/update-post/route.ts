import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";

export async function POST() {
  try {
    const result = await client
      .patch("bd73e4b0-ed73-4997-b447-df0f4a391163")
      .set({
        title: "Complete React Tutorial for Beginners",
      })
      .commit();

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update post",
      },
      {
        status: 500,
      }
    );
  }
}