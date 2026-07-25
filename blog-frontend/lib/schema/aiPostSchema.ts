// lib/schema/aiPostSchema.ts
import { z } from "zod";

// ---- Input: what the author fills in the form ----
export const generateFormSchema = z.object({
  topic: z.string().min(3).max(200),
  audience: z.enum(["beginner", "intermediate", "advanced"]),
  tone: z.enum(["professional", "casual", "technical", "friendly"]),
  length: z.enum(["short", "medium", "long"]),
  keywords: z.string().min(2).max(300), // comma separated
  categoryId: z.string().min(1), // Sanity _id of an existing category
  authorId: z.string().min(1), // Sanity _id of an existing author
});
export type GenerateFormInput = z.infer<typeof generateFormSchema>;

// ---- Manus structured_output_schema ----
// This is the SINGLE source of truth for the output shape — it's what
// actually gets enforced, via post-run extraction. Your Manus Project's
// output-schema.md is redundant with this now that structured_output_schema
// is wired in; if you keep that file at all, trim it to just documenting
// what each field means, not "return only JSON, no explanations" (that
// fights the agent's normal flow — see the char length note below too).
//
// IMPORTANT: this dialect does NOT support minLength/maxLength/pattern/etc.
// Length constraints from post.ts (title/excerpt 10-80 chars) are enforced
// below with Zod, AFTER we get the value back from Manus.
export const manusPostOutputSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Blog post title, 10 to 80 characters, no clickbait.",
    },
    excerpt: {
      type: "string",
      description: "Short summary, 10 to 80 characters, used as a card excerpt.",
    },
    seoTitle: {
      type: "string",
      description: "SEO title, ideally under 60 characters.",
    },
    seoDescription: {
      type: "string",
      description: "SEO meta description, under 160 characters.",
    },
    contentMarkdown: {
      type: "string",
      description:
        "Full article body in Markdown. Use ## and ### headings, no h1. Include a blockquote where relevant.",
    },
  },
  required: [
    "title",
    "excerpt",
    "seoTitle",
    "seoDescription",
    "contentMarkdown",
  ],
  additionalProperties: false,
} as const;

// ---- Output: re-validated on our side against the REAL post.ts constraints ----
export const generatedPostSchema = z.object({
  title: z.string().min(10).max(80),
  excerpt: z.string().min(10).max(80),
  seoTitle: z.string().min(10),
  seoDescription: z.string(),
  contentMarkdown: z.string().min(50),
});
export type GeneratedPost = z.infer<typeof generatedPostSchema>;

/**
 * Builds the prompt sent to Manus. Deliberately minimal — style, markdown
 * format, SEO rules and the quality checklist all live in the Manus
 * Project's instructions (writing-style.md, markdown-format.md,
 * seo-guidelines.md, quality-checklist.md) and apply automatically as
 * long as project_id is passed in createManusTask(). This is just the
 * per-task variables the project instructions ask for.
 */
export function buildPrompt(input: GenerateFormInput): string {
  const lines = [
    `Topic: ${input.topic}`,
    `Target audience: ${input.audience}`,
    `Tone: ${input.tone}`,
    `Target length: ${input.length}`,
  ];
  if (input.keywords?.trim()) {
    lines.push(`Keywords to naturally include: ${input.keywords}`);
  }
  return lines.join("\n");
}
