import { client } from "@/lib/sanity";
import { SEARCH_POSTS_QUERY } from "@/lib/queries";
import PostCard from "../components/PostCard";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const searchTerm = q.trim();

  const posts = await client.fetch(SEARCH_POSTS_QUERY, {
    search: searchTerm ? `*${searchTerm}*` : "*",
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Search</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Find the content you need</h1>
        <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="q"
            defaultValue={searchTerm}
            placeholder="Search by title or topic"
            className="w-full rounded-full border border-slate-300 px-4 py-3 text-sm outline-none ring-0 focus:border-slate-900"
          />
          <button type="submit" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Search
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          {searchTerm ? `Showing results for “${searchTerm}”` : "Showing all posts"}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {posts.length === 0 ? (
          <p className="text-slate-600">No posts found.</p>
        ) : (
          posts.map((post: any) => <PostCard key={post._id} post={post} />)
        )}
      </div>
    </main>
  );
}