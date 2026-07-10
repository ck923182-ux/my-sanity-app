export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">About</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
          A modern blog experience built for clarity and growth.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          This website combines the power of Sanity for content management with the flexibility of Next.js for a fast, professional presentation layer.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">What it offers</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Responsive navigation and mobile-friendly layout</li>
              <li>• Clean homepage with featured blog cards</li>
              <li>• Category, author, and search experiences</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Built with</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Sanity CMS</li>
              <li>• Next.js App Router</li>
              <li>• Tailwind CSS</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
