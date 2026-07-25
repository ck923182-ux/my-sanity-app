// app/admin/generate/page.tsx
import { client } from "@/lib/sanity";
import { GenerateForm } from "./GenerateForm";

interface Option {
  _id: string;
  label: string;
}

async function getOptions() {
  const [categories, authors] = await Promise.all([
    client.fetch<Option[]>(`*[_type == "category"]{_id, "label": title} | order(label asc)`),
    client.fetch<Option[]>(`*[_type == "author"]{_id, "label": name} | order(label asc)`),
  ]);
  return { categories, authors };
}

export default async function GeneratePage() {
  const { categories, authors } = await getOptions();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">AI content generator</h1>
      <p className="mt-1 text-sm text-gray-500">
        Generates a draft post for review in Sanity Studio. Nothing is published automatically.
      </p>
      <GenerateForm categories={categories} authors={authors} />
    </main>
  );
}
