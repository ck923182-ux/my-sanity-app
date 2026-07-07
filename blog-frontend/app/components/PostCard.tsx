import { Post } from "../types/post";
import Image from "next/image";
import { urlFor } from "@/lib/image";
import Link from "next/link";

interface PostCardProps {
    post: Post;
}
export default function PostCard({ post }: PostCardProps) {

    return (
        <article
            style={{
                border: "1px solid #ddd",
                padding: "20px",
                marginBottom: "20px",
            }}
        >
            {post.featuredImage && (
                <Image
                    src={urlFor(post.featuredImage).width(600).height(350).url()}
                    alt={post.title}
                    width={600}
                    height={350}
                />
            )}
            <Link href={`/blog/${post.slug.current}`}>
                <h2>{post.title}</h2>
            </Link>
            <p>{post.excerpt}</p>

            <p>
                <strong>Author:</strong> {post.author.name}
            </p>

            <p>
                <strong>Category:</strong> {post.category.title}
            </p>

            <p>
                <strong>Published:</strong>{" "}
                {new Date(post.publishedAt).toLocaleDateString()}
            </p>
        </article>
    );
}