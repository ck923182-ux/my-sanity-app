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
  const Tag =
    headingTagMap[block.heading?.headingTag ?? "h2"] ?? "h2";

  const imageOnRight = block.imagePosition === "right";

  return (
    <div className="two-column-stripe mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">

      {/* Text column */}
      <div
        className={`flex flex-col gap-6 ${
          imageOnRight ? "lg:order-1" : "lg:order-2"
        }`}
      >
        {block.heading?.heading && (
          <Tag className="text-3xl font-bold tracking-tight sm:text-4xl">
            {block.heading.heading}
          </Tag>
        )}

        {block.Content && (
          <div className="prose prose-slate max-w-none">
            <PortableText value={block.Content as any} />
          </div>
        )}

        {block.twocolumnbutton && (
          <div>
            <Link
              href={block.twocolumnbutton.link}
              className={
                block.twocolumnbutton.variant === "primary"
                  ? "group inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-lg"
                  : "group inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
              }
            >
              {block.twocolumnbutton.text}
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* Image column */}
      {block.image && (
        <div
          className={`group relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100 shadow-lg transition-shadow duration-300 hover:shadow-xl ${
            imageOnRight ? "lg:order-2" : "lg:order-1"
          }`}
        >
          <Image
            src={urlFor(block.image).width(900).height(675).url()}
            alt={block.heading?.heading ?? "Section image"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />

          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
        </div>
      )}
    </div>
  );
}
