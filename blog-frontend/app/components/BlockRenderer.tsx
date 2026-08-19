/**
 * BlockRenderer
 *
 * Renders any Page Builder block by mapping its `_type` to the correct
 * React component. To add a new block:
 *   1. Create its component in app/components/blocks/
 *   2. Add its type to the `blockMap` below — that's it.
 */

import type { PageBuilderBlock } from "@/app/types/pageBuilder";

import HeroSection from "./blocks/HeroSection";
import Feature from "./blocks/Feature";
import TwoColumn from "./blocks/TwoColumn";
import FeaturedBlog from "./blocks/FeaturedBlog";
import BlogStats from "./blocks/BlogStats";
import Timeline from "./blocks/Timeline";
import TopAuthor from "./blocks/TopAuthor";
import ExploreCategory from "./blocks/ExploreCategory";
import MeetOurTeam from "./blocks/MeetOurTeam";

// ─── Block map ────────────────────────────────────────────────────────────────
// Key   = Sanity _type string
// Value = React component that accepts { block }

// Using `any` here intentionally: each component is typed via its own props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockMap: Record<string, React.ComponentType<{ block: any }>> = {
  heroSection: HeroSection,
  feature: Feature,
  twocolumn: TwoColumn,
  featurblog: FeaturedBlog,
  blogStats: BlogStats,
  timeline: Timeline,
  topauthor: TopAuthor,
  explorcategoey: ExploreCategory,
  meetourteam: MeetOurTeam,
};

// ─── Component ────────────────────────────────────────────────────────────────

interface BlockRendererProps {
  blocks: PageBuilderBlock[];
}

export default function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block) => {
        const Component = blockMap[block._type];

        if (!Component) {
          // In development, surface unknown blocks so you can add them.
          if (process.env.NODE_ENV === "development") {
            return (
              <div
                key={block._key}
                className="border border-dashed border-amber-400 bg-amber-50 px-4 py-6 text-center text-sm text-amber-700"
              >
                No component registered for block type:{" "}
                <strong>{block._type}</strong>
              </div>
            );
          }
          return null;
        }

        return <Component key={block._key} block={block} />;
      })}
    </>
  );
}
