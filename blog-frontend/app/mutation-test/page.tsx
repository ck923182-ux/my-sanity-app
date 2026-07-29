"use client";
import { client } from "@/lib/sanity";
import { createPost } from "./actions";
export default function MutationTestPage() {

  return (
    <div className="p-10">
      <h1 className="mb-6 text-3xl font-bold">Sanity Mutation Practice</h1>

      <button
        onClick={createPost}
        className="rounded bg-blue-600 px-6 py-3 text-white"
      >
        Create Post
      </button>
    </div>
  );
}
