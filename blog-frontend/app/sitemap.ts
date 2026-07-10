import { MetadataRoute } from "next";
import { client } from "@/lib/sanity";
import { SITEMAP_POSTS_QUERY } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const posts = await client.fetch(SITEMAP_POSTS_QUERY);

  const blogPosts = posts.map((post: any) => ({
    url: `http://localhost:3000/blog/${post.slug.current}`,
    lastModified: new Date(post._updatedAt),
  }));

  return [
    {
      url: "http://localhost:3000",
      lastModified: new Date(),
    },
    {
      url: "http://localhost:3000/blog",
      lastModified: new Date(),
    },
    {
      url: "http://localhost:3000/about",
      lastModified: new Date(),
    },
    {
      url: "http://localhost:3000/search",
      lastModified: new Date(),
    },
    {
      url: "http://localhost:3000/category",
      lastModified: new Date(),
    },
    {
      url: "http://localhost:3000/author",
      lastModified: new Date(),
    },

    ...blogPosts,
  ];
}