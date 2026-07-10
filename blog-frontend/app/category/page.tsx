import { client } from "@/lib/sanity";
import { CATEGORIES_QUERY } from "@/lib/queries";
import Link from "next/link";

export default async function CategoryListingPage() {
  const categories = await client.fetch(CATEGORIES_QUERY);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Categories</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Browse posts by category</h1>
        <p className="mt-3 text-slate-600">Find the topics that matter most to you and jump into the latest stories.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((category: any) => (
          <Link
            key={category._id}
            href={`/category/${category.slug.current}`}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">{category.title}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                {category.postCount} posts
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
