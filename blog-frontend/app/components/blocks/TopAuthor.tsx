import Link from "next/link";
import type { TopAuthorBlock } from "@/app/types/pageBuilder";

export default function TopAuthor({ block }: { block: TopAuthorBlock }) {
  const { sectionTitle, authors } = block;

  if (!authors || authors.length === 0) return null;

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {sectionTitle && (
          <h2 className="mb-10 text-center text-3xl font-semibold text-slate-900 sm:text-4xl">
            {sectionTitle}
          </h2>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {authors.map((author) => (
            <Link
              key={author._id}
              href={`/author/${author.slug.current}`}
              className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {/* Avatar */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">
                {author.name.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <p className="text-center text-base font-semibold text-slate-900 group-hover:underline">
                {author.name}
              </p>

              {/* Bio */}
              {author.bio && (
                <p className="line-clamp-2 text-center text-sm leading-6 text-slate-500">
                  {author.bio}
                </p>
              )}

              <span className="mt-auto text-xs font-medium text-slate-400 group-hover:text-slate-700">
                View profile →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
