import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="text-lg font-semibold text-white">Sanity Blog</p>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            A polished content experience built with Sanity and Next.js for modern publishing.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/" className="transition hover:text-white">Home</Link></li>
            <li><Link href="/category" className="transition hover:text-white">Categories</Link></li>
            <li><Link href="/author" className="transition hover:text-white">Authors</Link></li>
            <li><Link href="/about" className="transition hover:text-white">About</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Quick links</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/search" className="transition hover:text-white">Search</Link></li>
            <li><Link href="/blog" className="transition hover:text-white">Latest posts</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
        © 2026 Sanity Blog. Crafted for modern content publishing.
      </div>
    </footer>
  );
}