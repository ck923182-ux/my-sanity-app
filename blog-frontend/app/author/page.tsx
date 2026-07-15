import { client } from "@/lib/sanity";
import { AUTHORS_QUERY } from "@/lib/queries";
import Link from "next/link";

export default async function AuthorListingPage() {
  const authors = await client.fetch(AUTHORS_QUERY);
  console.log(authors);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Authors</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Meet the writers</h1>
        <p className="mt-3 text-slate-600">Discover all authors and explore the posts they have published.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {authors.map((author: any) => (
          <Link
            key={author._id}
            href={`/author/${author.slug.current}`}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">{author.name}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                {author.postCount} posts
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
