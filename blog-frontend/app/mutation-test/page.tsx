"use client";
import { client } from "@/lib/sanity";
import { createPost } from "./actions";
import { updatePost } from "./actions";
import { deletePost } from "./actions";
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
      <button
        onClick={async () => {
          const result = await updatePost();
          console.log(result);
        }}
        className="rounded bg-green-600 px-6 py-3 text-white"
      >
        Update Post
      </button>
      <button
        onClick={async () => {
          const result = await deletePost();
          console.log(result);
        }}
        className="rounded bg-green-600 px-6 py-3 text-white"
      >
        Delete Post
      </button>
    </div>
  );
}
