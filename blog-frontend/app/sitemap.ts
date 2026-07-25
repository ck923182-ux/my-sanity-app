import { MetadataRoute } from "next";
import { client } from "@/lib/sanity";
import { SITEMAP_POSTS_QUERY } from "@/lib/queries";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await client.fetch(SITEMAP_POSTS_QUERY);

  const blogPosts = posts.map((post: any) => ({
    url: `${BASE_URL}/blog/${post.slug.current}`,
    lastModified: new Date(post._updatedAt),
  }));

  return [
    { url: `${BASE_URL}`,          lastModified: new Date() },
    { url: `${BASE_URL}/blog`,     lastModified: new Date() },
    { url: `${BASE_URL}/about`,    lastModified: new Date() },
    { url: `${BASE_URL}/search`,   lastModified: new Date() },
    { url: `${BASE_URL}/category`, lastModified: new Date() },
    { url: `${BASE_URL}/author`,   lastModified: new Date() },
    ...blogPosts,
  ];
}
