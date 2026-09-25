"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("BLOG ERROR:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-2xl font-semibold text-red-900">
          Something went wrong!
        </h2>

        <p className="mt-3 text-red-700">
          We couldn't load the blog right now.
        </p>

        <button
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}