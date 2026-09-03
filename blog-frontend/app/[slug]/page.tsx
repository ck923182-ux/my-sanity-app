import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { PAGE_QUERY } from "@/lib/queries";
// import { ALL_PAGES_QUERY } from "@/lib/queries";
import type { PageDocument } from "@/app/types/pageBuilder";
import BlockRenderer from "@/app/components/BlockRenderer";

// ─── Static params for pre-rendering ─────────────────────────────────────────

export async function generateStaticParams() {
  const pages: { slug: { current: string } }[] =
    await client.fetch(PAGE_QUERY);

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
  const page: PageDocument | null = await client.fetch(PAGE_QUERY, { slug });

  if (!page) notFound();

  return (
    <main>
      <BlockRenderer blocks={page.pageBuilder} />
    </main>
  );
}
