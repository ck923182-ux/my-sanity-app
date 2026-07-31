"use server";

import { client } from "@/lib/sanity";
import { ftruncate } from "fs";
import { title } from "process";
import { success } from "zod";

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

export async function updatePost() {
  try {
    const result = await client
      .patch("edgtDejVJGaG18AH3C77pg")
      .set({
        title: "Learning Sanity Mutations",
      })
      .commit();

    console.log("Updated Document:", result);

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
