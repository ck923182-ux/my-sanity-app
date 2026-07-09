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

  const posts = await client.fetch(AUTHOR_POSTS_QUERY, {
    slug,
  });

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
      }}
    >
      <h1>Author: {slug}</h1>

      {posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        posts.map((post: any) => (
          <PostCard
            key={post._id}
            post={post}
          />
        ))
      )}
    </main>
  );
}