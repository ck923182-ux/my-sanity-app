import { client } from "@/lib/sanity";
import { POSTS_QUERY, POSTS_COUNT_QUERY, CATEGORIES_QUERY } from "@/lib/queries";
import Link from "next/link";
import PostCard from "../components/PostCard";
import CategorySidebar from "../components/CategorySidebar";
import Hero from "../components/Hero";

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page = "1" } = await searchParams;
  const currentPage = Number(page);
  const POST_PER_PAGE = 4;
  const start = (currentPage - 1) * POST_PER_PAGE;
  const end = start + POST_PER_PAGE;

  const posts = await client.fetch(POSTS_QUERY, { start, end });
  const totalPost = await client.fetch(POSTS_COUNT_QUERY);
  const totalPages = Math.ceil(totalPost / POST_PER_PAGE);
  const categories = await client.fetch(CATEGORIES_QUERY);

  return (
    <>
      {/* <Hero /> */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Blog</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">All published articles</h1>
          <p className="mt-3 text-slate-600">Browse the full archive of stories, tutorials, and insights.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.7fr_0.7fr]">
          <section className="space-y-6">
            {posts.map((post: any) => (
              <PostCard key={post._id} post={post} />
            ))}

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              {currentPage > 1 ? (
                <Link href={`/blog?page=${currentPage - 1}`} className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                  ← Previous
                </Link>
              ) : (
                <span />
              )}

              <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>

              {currentPage < totalPages ? (
                <Link href={`/blog?page=${currentPage + 1}`} className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <CategorySidebar categories={categories} />
          </aside>
        </div>
      </main>
    </>

  );
}
