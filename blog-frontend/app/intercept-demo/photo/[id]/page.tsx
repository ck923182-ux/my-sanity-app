export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border p-8">
        <h1 className="text-3xl font-bold">
          Full Photo Page
        </h1>

        <p className="mt-4 text-lg">
          You are viewing Photo {id} as a full page.
        </p>

        <p className="mt-2 text-gray-600">
          This is the normal /photo/[id] route.
        </p>
      </div>
    </div>
  );
}