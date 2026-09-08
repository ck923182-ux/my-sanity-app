import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { PAGE_QUERY, ALL_PAGES_QUERY, THEME_COLORS_QUERY } from "@/lib/queries";
import type { PageDocument, ThemeColor } from "@/app/types/pageBuilder";
import BlockRenderer from "@/app/components/BlockRenderer";
import { ThemeProvider } from "@/app/context/ThemeContext";

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const pages: { slug: { current: string } }[] =
    await client.fetch(ALL_PAGES_QUERY);
  return pages.map((page) => ({ slug: page.slug.current }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page: PageDocument | null = await client.fetch(PAGE_QUERY, { slug });
  if (!page) return {};
  return { title: page.title };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch page + global palette in parallel
  const [page, palette] = await Promise.all([
    client.fetch<PageDocument | null>(PAGE_QUERY, { slug }),
    client.fetch<ThemeColor[]>(THEME_COLORS_QUERY),
  ]);

  if (!page) notFound();

  return (
    <ThemeProvider palette={palette ?? []}>
      <main>
        <BlockRenderer blocks={page.pageBuilder} />
      </main>
    </ThemeProvider>
  );
}
