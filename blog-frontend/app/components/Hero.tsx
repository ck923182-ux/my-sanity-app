import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium">
            Latest stories from the modern web
          </p>
          <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Build smarter ideas with content that connects.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Discover thoughtful articles, practical tutorials, and fresh perspectives delivered in a polished reading experience.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/search" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Search posts
            </Link>
            <Link href="/about" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Learn more
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Highlights</p>
            <p className="mt-2 text-2xl font-semibold text-white">Thoughtful publishing, elegantly presented.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-2xl font-semibold text-white">100+</p>
              <p className="text-sm text-slate-400">Stories shared</p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-2xl font-semibold text-white">24/7</p>
              <p className="text-sm text-slate-400">Reader friendly</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}