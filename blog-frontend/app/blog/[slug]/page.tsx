import { client } from "@/lib/sanity";
import { SINGLE_POST_QUERY, RELATED_POSTS_QUERY } from "@/lib/queries";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/lib/image";
import PostCard from "@/app/components/PostCard";
import PortableTextRenderer from "@/app/components/PortableText";
interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPage({ params }: Props) {
  const { slug } = await params;

  const post = await client.fetch(SINGLE_POST_QUERY, { slug }
    , {
      next: {
        revalidate: 60,
      },
    }

  );
  const relatedPosts = await client.fetch(RELATED_POSTS_QUERY, {
    categoryId: post?.category?._id,
    slug,
  });

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-900">Post not found</h1>
        <p className="mt-4 text-slate-600">The article you are looking for does not exist.</p>
      </main>
    );
  }

  return (
    <div className="bg-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          {post.featuredImage ? (
            <Image
              src={urlFor(post.featuredImage).width(1400).height(700).url()}
              alt={post.title}
              width={1400}
              height={700}
              className="mb-8 h-[280px] w-full rounded-3xl object-cover sm:h-[360px]"
            />
          ) : null}

          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              {post.category.title}
            </span>
            <span>•</span>
            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
          </div>

          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{post.title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{post.excerpt}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span>By {post.author.name}</span>
            <span>•</span>
            <span>{post.category.title}</span>
          </div>

          <div className="prose prose-slate mt-10 max-w-none prose-headings:text-slate-900 prose-a:text-slate-900">
            {/* <PortableText value={post.content} /> */}
            <PortableTextRenderer value={post.content} />

          </div>
        </article>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900">Related posts</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {relatedPosts.length > 0 ? (
              relatedPosts.map((relatedPost: any) => <PostCard key={relatedPost._id} post={relatedPost} />)
            ) : (
              <p className="text-slate-600">No related posts found.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}