import Link from "next/link";
import type { TopAuthorBlock } from "@/app/types/pageBuilder";

export default function TopAuthor({ block }: { block: TopAuthorBlock }) {
  const { sectionTitle, authors } = block;

  if (!authors || authors.length === 0) return null;

  return (
    <section className="top-author-stripe mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {sectionTitle && (
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight  sm:text-4xl">
          {sectionTitle}
        </h2>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {authors.map((author, i) => (
          <Link
            key={author._id}
            href={`/author/${author.slug.current}`}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-lg"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white shadow-md ring-4 ring-white transition-transform duration-300 group-hover:scale-110">
              {author.name.charAt(0).toUpperCase()}
            </div>

            <div className="text-center">
              <p className="text-base font-semibold text-slate-900 transition-colors group-hover:text-slate-700">
                {author.name}
              </p>
              {author.bio && (
                <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-500">
                  {author.bio}
                </p>
              )}
            </div>

            <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition-all duration-200 group-hover:gap-2 group-hover:text-slate-700">
              View profile →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
