import { Post } from "../types/post";
import Image from "next/image";
import { urlFor } from "@/lib/image";
import Link from "next/link";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        {post.featuredImage ? (
          <Image
            src={urlFor(post.featuredImage).width(800).height(500).url()}
            alt={post.title}
            width={800}
            height={500}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No image available
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href={`/category/${post.category.slug.current}`} className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            {post.category.title}
          </Link>
          {(post.posttag ?? []).map((tag) => (
            <span key={tag.slug.current}>{tag.title}</span>
          ))}
          <span>•</span>
          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
        </div>

        <Link href={`/blog/${post.slug.current}`}>
          <h2 className="text-xl font-semibold text-slate-900 transition group-hover:text-slate-700">
            {post.title}
          </h2>
        </Link>

        <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/author/${post.author.slug.current}`} className="text-sm font-medium text-slate-700">
            By {post.author.name}
          </Link>
          <Link href={`/blog/${post.slug.current}`} className="text-sm font-semibold text-slate-900">
            Read more →
          </Link>
        </div>
      </div>
    </article>
  );
}