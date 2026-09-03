import Link from "next/link";
import type { ExploreCategoryBlock } from "@/app/types/pageBuilder";

export default function ExploreCategory({ block }: { block: ExploreCategoryBlock }) {
  const { sectionTitle, categories } = block;

  if (!categories || categories.length === 0) return null;

  return (
    <section className="explore-category-stripe mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {sectionTitle && (
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          {sectionTitle}
        </h2>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat, i) => (
          <Link
            key={cat._id}
            href={`/category/${cat.slug.current}`}
            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-900 hover:bg-slate-900 hover:shadow-lg"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="text-base font-semibold text-slate-900 transition-colors duration-200 group-hover:text-white">
              {cat.title}
            </span>

            <span className="flex items-center gap-2">
              {cat.postCount !== undefined && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 transition-all duration-200 group-hover:bg-white/20 group-hover:text-white">
                  {cat.postCount}
                </span>
              )}
              <span className="text-slate-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-white">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
