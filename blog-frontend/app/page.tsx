import { client } from "@/lib/sanity";
import { POSTS_QUERY, POSTS_COUNT_QUERY, CATEGORIES_QUERY } from "@/lib/queries";
import { Post } from "./types/post";

import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import PostCard from "./components/PostCard";
import { promises } from "dns";
import { match } from "assert";
import CategorySidebar from "./components/CategorySidebar";


interface HomapageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}


export default async function HomePage({ searchParams }: HomapageProps) {

  const { page = "1" } = await searchParams;
  const currentPage = Number(page);
  const POST_PER_PAGE = 2;
  const start = (currentPage - 1) * POST_PER_PAGE;
  const end = start + POST_PER_PAGE;
  const posts: Post[] = await client.fetch(POSTS_QUERY, {
    start, end
  });

  const totalPost = await client.fetch(POSTS_COUNT_QUERY);
  const totalPages = Math.ceil(totalPost / POST_PER_PAGE);

  const categories = await client.fetch(CATEGORIES_QUERY);
  console.table(categories);

  return (

    <>
      <Header />

      <Hero />

      <main
        style={{
          maxWidth: "1200px",
          margin: "40px auto",
          display: "flex",
          gap: "40px",
        }}
      >
        {/* Left Side - Posts */}
        <div style={{ flex: 3 }}>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
            />
          ))}

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "40px",
            }}
          >
            {currentPage > 1 ? (
              <Link href={`/?page=${currentPage - 1}`}>
                ← Previous
              </Link>
            ) : (
              <span />
            )}

            <span>
              Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link href={`/?page=${currentPage + 1}`}>
                Next →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>

        {/* Right Side - Sidebar */}
        <div style={{ flex: 1 }}>
          <CategorySidebar categories={categories} />
        </div>
      </main>

      <Footer />
    </>
  );
}