import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/lib/image";
import type { TwoColumnBlock } from "@/app/types/pageBuilder";

const headingTagMap = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
} as const;

export default function TwoColumn({ block }: { block: TwoColumnBlock }) {
  const Tag = headingTagMap[block.heading?.headingTag ?? "h2"] ?? "h2";

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        {/* Text column */}
        <div>
          {block.heading?.heading && (
            <Tag className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              {block.heading.heading}
            </Tag>
          )}

          {block.Content && (
            <div className="prose prose-slate mt-5 max-w-none">
              <PortableText value={block.Content as any} />
            </div>
          )}

          {block.twocolumnbutton && (
            <div className="mt-8">
              <Link
                href={block.twocolumnbutton.link}
                className={
                  block.twocolumnbutton.variant === "primary"
                    ? "rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                    : "rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                }
              >
                {block.twocolumnbutton.text}
              </Link>
            </div>
          )}
        </div>

        {/* Image column */}
        {block.image && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100">
            <Image
              src={urlFor(block.image).width(800).height(600).url()}
              alt={block.heading?.heading ?? "Section image"}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        )}
      </div>
    </section>
  );
}
