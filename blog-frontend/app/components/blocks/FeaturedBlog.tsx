import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/lib/image";
import type { FeaturedBlogBlock } from "@/app/types/pageBuilder";

export default function FeaturedBlog({ block }: { block: FeaturedBlogBlock }) {
  const { eyebrow, featurtitle, Content, featurebutton, blog } = block;

  return (
    <section className="feature-blogs mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {(eyebrow || featurtitle) && (
        <div className="mb-10">
          {eyebrow && (
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
              {eyebrow}
            </p>
          )}
          {featurtitle && (
            <h2 className="text-3xl font-bold tracking-tight  sm:text-4xl">
              {featurtitle}
            </h2>
          )}
          {Content && (
            <div className="prose prose-slate mt-4 max-w-2xl ">
              <PortableText value={Content as any} />
            </div>
          )}
        </div>
      )}

      {/* Card */}
      <div className="group grid items-stretch overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl lg:grid-cols-2">
        {blog.featuredImage && (
          <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 lg:aspect-auto">
            <Image
              src={urlFor(blog.featuredImage).width(900).height(600).url()}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        )}

        <div className="flex flex-col justify-center gap-4 p-8 lg:p-10">
          {blog.category && (
            <Link
              href={`/category/${blog.category.slug.current}`}
              className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {blog.category.title}
            </Link>
          )}

          <h3 className="text-2xl font-bold tracking-tight  transition-colors duration-200 group-hover:text-slate-700">
            {blog.title}
          </h3>

          {blog.excerpt && (
            <p className="line-clamp-3 text-sm leading-7 text-slate-600">{blog.excerpt}</p>
          )}

          {blog.publishedAt && (
            <p className="text-xs text-slate-400">
              {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/blog/${blog.slug.current}`}
              className="group/btn inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-slate-700 hover:shadow-lg hover:-translate-y-0.5"
            >
              Read article
              <span className="transition-transform duration-200 group-hover/btn:translate-x-0.5">→</span>
            </Link>

            {featurebutton && (
              <Link
                href={featurebutton.link}
                className={
                  featurebutton.variant === "primary"
                    ? "inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-700 hover:-translate-y-0.5"
                    : "inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-0.5"
                }
              >
                {featurebutton.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
