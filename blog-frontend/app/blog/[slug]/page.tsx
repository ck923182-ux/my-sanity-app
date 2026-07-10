import { client } from "@/lib/sanity";
import { SINGLE_POST_QUERY, RELATED_POSTS_QUERY } from "@/lib/queries";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/lib/image";
import PostCard from "@/app/components/PostCard";

interface Props {
    params: Promise<{
        slug: string;
    }>;
}

export default async function BlogPage({ params }: Props) {
    const { slug } = await params;

    const post = await client.fetch(SINGLE_POST_QUERY, {
        slug,
    });

    const relatedPosts = await client.fetch(RELATED_POSTS_QUERY, {

        categoryId: post.category._id,
        slug,
    })

    if (!post) {
        return <h1>Post Not Found</h1>;
    }

    return (
        <>
            <div style={{ maxWidth: "800px", margin: "40px auto" }}>
                {post.featuredImage && (
                    <Image
                        src={urlFor(post.featuredImage).width(1200).height(600).url()}
                        alt={post.title}
                        width={1200}
                        height={600}
                        style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: "8px",
                            marginBottom: "20px",
                        }}
                    />
                )}
                <h1>{post.title}</h1>

                <p>{post.excerpt}</p>

                <hr />

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
                <hr />

                <PortableText value={post.content} />
            </div>
            <div className="ralatedpost">
                <h2>Related Posts</h2>
                {relatedPosts.length > 0 ? (
                    relatedPosts.map((post: any) => (
                        <PostCard
                            key={post._id}
                            post={post}
                        />
                    ))
                ) : (
                    <p>No related posts found.</p>
                )}
            </div>
        </>


    );
}