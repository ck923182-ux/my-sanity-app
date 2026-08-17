import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-sanity-webhook-secret");

    if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    console.log("🔥 SANITY WEBHOOK PAYLOAD:");
    console.log(JSON.stringify(body, null, 2));

    revalidatePath("/");
    revalidatePath("/blog");

    if (body._type === "post" && body.slug?.current) {
      const slug = body.slug?.current;

      revalidatePath(`/blog/${slug}`);
      console.log(`✅ Revalidated post: /blog/${slug}`);
    }

    return NextResponse.json({
      success: true,
      message: "Revalidation successful",
    });
  } catch (error) {
    console.error("Revalidation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Revalidation failed",
      },
      { status: 500 },
    );
  }
}
