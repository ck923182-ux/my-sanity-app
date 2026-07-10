import Link from "next/link";
import Hero from "./components/Hero";

export default function HomePage() {
  return (
    <div className="bg-slate-50">
      <Hero />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Home page content
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Welcome to a professional blog experience built for stories, authors, and categories.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              This homepage is now reserved for your main landing page content. The full post archive is available from the dedicated blog section, while categories and authors have their own browse pages.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/blog" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                Browse blog posts
              </Link>
              <Link href="/about" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
                Learn more about the site
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 p-6 text-slate-300">
            <h3 className="text-xl font-semibold text-white">What you can do here</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7">
              <li>• Read the latest posts from the blog section</li>
              <li>• Explore content by category and author</li>
              <li>• Search across all published stories</li>
              <li>• Replace this section with your own Sanity home-page fields later</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}