import { client } from "@/lib/sanity";
import { AUTHOR_POSTS_QUERY } from "@/lib/queries";
import PostCard from "@/app/components/PostCard";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const posts = await client.fetch(AUTHOR_POSTS_QUERY, { slug });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Author</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{slug}</h1>
        <p className="mt-3 text-slate-600">Discover all the posts published by this writer.</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-slate-600">No posts found.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {posts.map((post: any) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}