import { client } from "@/lib/sanity";
import { SEARCH_POSTS_QUERY } from "@/lib/queries";
import PostCard from "../components/PostCard";

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
    }>;
}

export default async function SearchPage({ searchParams, }: SearchPageProps) {
    const { q = "" } = await searchParams;

    const posts = await client.fetch(SEARCH_POSTS_QUERY, {
        search: `*${q}*`,
    });
    console.table(posts);

    console.log(JSON.stringify(posts, null, 2));
    posts.forEach((post: any) => {
        console.log(post._id, post.title);
    });
    return (
        <main
            style={{
                maxWidth: "900px",
                margin: "40px auto",
            }}
        >
            <h1>Search Results</h1>

            <p>
                Searching for: <strong>{q || "All Posts"}</strong>
            </p>

            {posts.length === 0 ? (
                <p>No posts found.</p>
            ) : (
                posts.map((post: any) => (
                    <PostCard key={post._id} post={post} />
                ))
            )}
        </main>
    );
}