import Link from "next/link";
import type { ExploreCategoryBlock } from "@/app/types/pageBuilder";

export default function ExploreCategory({ block }: { block: ExploreCategoryBlock }) {
  const { sectionTitle, categories } = block;

  if (!categories || categories.length === 0) return null;

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {sectionTitle && (
          <h2 className="mb-10 text-center text-3xl font-semibold text-slate-900 sm:text-4xl">
            {sectionTitle}
          </h2>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/category/${cat.slug.current}`}
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-900 hover:shadow-md"
            >
              <span className="text-base font-semibold text-slate-900 group-hover:underline">
                {cat.title}
              </span>

              <span className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-700">
                {cat.postCount !== undefined && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {cat.postCount}
                  </span>
                )}
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
