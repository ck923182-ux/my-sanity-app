interface Category {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  postCount: number;
}

interface CategorySidebarProps {
  categories: Category[];
}

import Link from "next/link";

export default function CategorySidebar({ categories }: CategorySidebarProps) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Browse categories</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Explore posts by topic and jump into the stories that matter most to you.
      </p>

      <ul className="mt-6 space-y-3">
        {categories.map((category) => (
          <li key={category._id}>
            <Link
              href={`/category/${category.slug.current}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              <span>{category.title}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                {category.postCount}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl bg-slate-900 p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">Need inspiration?</p>
        <p className="mt-2">Use search to quickly find the article or author you want.</p>
      </div>
    </aside>
  );
}