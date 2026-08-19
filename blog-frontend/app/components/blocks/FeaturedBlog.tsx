import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { urlFor } from "@/lib/image";
import type { FeaturedBlogBlock } from "@/app/types/pageBuilder";

export default function FeaturedBlog({ block }: { block: FeaturedBlogBlock }) {
  const { eyebrow, featurtitle, Content, featurebutton, blog } = block;

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {(eyebrow || featurtitle) && (
          <div className="mb-10">
            {eyebrow && (
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                {eyebrow}
              </p>
            )}
            {featurtitle && (
              <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                {featurtitle}
              </h2>
            )}
            {Content && (
              <div className="prose prose-slate mt-4 max-w-2xl">
                <PortableText value={Content as any} />
              </div>
            )}
          </div>
        )}

        {/* Featured post card */}
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
          {blog.featuredImage && (
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 lg:aspect-auto lg:h-full">
              <Image
                src={urlFor(blog.featuredImage).width(800).height(600).url()}
                alt={blog.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}

          <div className="p-8">
            {blog.category && (
              <Link
                href={`/category/${blog.category.slug.current}`}
                className="mb-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {blog.category.title}
              </Link>
            )}

            <h3 className="text-2xl font-semibold text-slate-900">
              {blog.title}
            </h3>

            {blog.excerpt && (
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {blog.excerpt}
              </p>
            )}

            {blog.publishedAt && (
              <p className="mt-4 text-xs text-slate-400">
                {new Date(blog.publishedAt).toLocaleDateString()}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/blog/${blog.slug.current}`}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Read article →
              </Link>

              {featurebutton && (
                <Link
                  href={featurebutton.link}
                  className={
                    featurebutton.variant === "primary"
                      ? "rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                      : "rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  }
                >
                  {featurebutton.text}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
