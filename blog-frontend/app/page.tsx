import { client } from "@/lib/sanity";
import { POSTS_QUERY } from "@/lib/queries";
import { Post } from "./types/post";

import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import PostCard from "./components/PostCard";

export default async function HomePage() {
  const posts: Post[] = await client.fetch(POSTS_QUERY);

  return (

    <>
      <Header />

      <Hero />

      <main
        style={{
          maxWidth: "900px",
          margin: "40px auto",
        }}
      >
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
          />
        ))}
        
      </main>

      <Footer />
    </>
  );
}