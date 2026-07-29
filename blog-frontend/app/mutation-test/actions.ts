"use server";

import { client } from "@/lib/sanity";

export async function createPost() {
  try {
    const result = await client.create({
      _type: "post",

      title: "My First Mutation Post",

      slug: {
        current: "my-first-mutation-post",
      },

      excerpt: "This post was created using a Sanity mutation.",

      featured: false,
    });

    console.log("Document Created");
    console.log(result);

    return {
      success: true,
      message: "Post Created Successfully",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Something went wrong",
    };
  }
}