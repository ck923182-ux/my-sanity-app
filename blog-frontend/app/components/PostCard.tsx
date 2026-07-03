import { Post } from "../types/post";

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
            <h2>{post.title}</h2>

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