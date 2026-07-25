// lib/finalizeGeneratedPost.ts
//
// Runs once a Manus task reports "completed". Shared by the API route
// (app/api/generate/status/[taskId]/route.ts) and the server action
// (app/admin/generate/actions.ts) so this logic exists in exactly one place.

import { generatedPostSchema } from "./schema/aiPostSchema";
import { markdownToPortableText } from "./markdownToPortableText";
import { writeClient } from "./sanity-write";

// naive de-dupe so a double-poll doesn't create two drafts for one task;
// swap for Redis/DB in production so it survives restarts and works across
// multiple server instances
const createdForTask = new Set<string>();

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 96) +
    "-" +
    Math.random().toString(36).slice(2, 7) // random suffix avoids collisions
  );
}

export type FinalizeResult =
  | { status: "already_created" }
  | { status: "invalid"; issues: unknown }
  | { status: "created"; draftId: string }
  | { status: "save_failed"; message: string };

export async function finalizeGeneratedPost(
  taskId: string,
  value: unknown,
  categoryId: string,
  authorId: string
): Promise<FinalizeResult> {
  if (createdForTask.has(taskId)) {
    return { status: "already_created" };
  }

  const parsed = generatedPostSchema.safeParse(value);
  if (!parsed.success) {
    return { status: "invalid", issues: parsed.error.issues };
  }

  const post = parsed.data;
  const contentBlocks = markdownToPortableText(post.contentMarkdown);
  const slug = slugify(post.title);

  try {
    const doc = await writeClient.create({
      _type: "post",
      _id: `drafts.${slug}`,
      title: post.title,
      slug: { _type: "slug", current: slug },
      excerpt: post.excerpt,
      content: contentBlocks,
      category: { _type: "reference", _ref: categoryId },
      author: { _type: "reference", _ref: authorId },
      publishedAt: new Date().toISOString(),
      featured: false,
      showSeo: true,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      aiGenerated: true,
      // featuredImage intentionally omitted - required in Studio, but a
      // draft can save without it. Author adds the image before publishing.
    });

    createdForTask.add(taskId);
    return { status: "created", draftId: doc._id };
  } catch (err) {
    console.error("Failed to create Sanity draft:", err);
    return {
      status: "save_failed",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
