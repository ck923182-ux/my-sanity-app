// lib/markdownToPortableText.ts
//
// Converts the Markdown Manus returns into valid Sanity Portable Text
// blocks (with proper _key/_type on every block and span). Do NOT ask the
// AI to hand-write Portable Text JSON directly — it will get _key values
// and markDefs wrong, and Studio will silently reject or mangle the post.
//
// npm install @tryfabric/martian

import { markdownToBlocks } from "@tryfabric/martian";
import type { PortableTextBlock } from "@portabletext/types";

export function markdownToPortableText(markdown: string): PortableTextBlock[] {
  // martian maps markdown headings to h1-h6 by default; your post.ts schema
  // only defines styles for normal/h2/h3/h4/blockquote, so anything outside
  // that set falls back to "normal" to avoid Studio validation errors.
  const allowedStyles = new Set(["normal", "h2", "h3", "h4", "blockquote"]);

const blocks = markdownToBlocks(markdown) as unknown as PortableTextBlock[];

  return blocks.map((block) => {
    if (block._type === "block" && !allowedStyles.has(block.style ?? "normal")) {
      return { ...block, style: "normal" };
    }
    return block;
  });
}
