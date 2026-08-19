/**
 * BlockRenderer
 *
 * Renders any Page Builder block by mapping its `_type` to the correct
 * React component. Each block is automatically wrapped in SectionWrapper
 * which applies the bg color, text color, and vertical padding chosen in
 * Sanity Studio — no changes needed in individual block components.
 *
 * To add a new block:
 *   1. Create its component in app/components/blocks/
 *   2. Add its type to the `blockMap` below — that's it.
 */

import type { PageBuilderBlock } from "@/app/types/pageBuilder";
import SectionWrapper from "./SectionWrapper";

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

// ─── Renderer ────────────────────────────────────────────────────────────────

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

        // Every block gets wrapped in SectionWrapper which applies
        // the user-chosen background color, text color, and padding.
        return (
          <SectionWrapper key={block._key} style={(block as any).style}>
            <Component block={block} />
          </SectionWrapper>
        );
      })}
    </>
  );
}
