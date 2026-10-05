"use client";

import { useRouter } from "next/navigation";

export default function PhotoModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <button
          onClick={() => router.back()}
          className="absolute right-4 top-4 rounded-full border px-3 py-1 text-sm"
        >
          Close
        </button>

        <h2 className="text-3xl font-bold">
          Photo Modal
        </h2>

        <p className="mt-4 text-lg">
          This is the Photo Modal.
        </p>

        <p className="mt-2 text-gray-600">
          This page is being rendered through an Intercepting Route.
        </p>
      </div>
    </div>
  );
}