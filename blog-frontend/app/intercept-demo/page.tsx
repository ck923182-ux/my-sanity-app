import Link from "next/link";

export default function InterceptDemoPage() {
  return (
    <div className="main">

    
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">
        Intercepting Routes Demo
      </h1>

      <p className="mt-3 text-gray-600">
        Click a photo to open it as a modal.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/intercept-demo/photo/1"
          className="rounded-xl border p-6 hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold">
            Photo 1
          </h2>

          <p className="mt-2 text-gray-600">
            Click to view Photo 1
          </p>
        </Link>

        <Link
          href="/intercept-demo/photo/2"
          className="rounded-xl border p-6 hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold">
            Photo 2
          </h2>

          <p className="mt-2 text-gray-600">
            Click to view Photo 2
          </p>
        </Link>
      </div>
    </div>
    <div className="dev">
             <h1>Main </h1>
    </div>
    </div>
  );
}