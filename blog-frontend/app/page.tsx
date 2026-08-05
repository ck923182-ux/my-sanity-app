import Link from "next/link";
import Hero from "./components/Hero";
import { HomePage } from "./types/home";
import { client } from "@/lib/sanity";
import { HOME_PAGE_QUERY } from "@/lib/queries";

export default async function Home() {

  const homepage: HomePage = await client.fetch(HOME_PAGE_QUERY);
  const { welcomeblog } = homepage;
  console.log("welcomeblog" + welcomeblog);
  console.table(welcomeblog);
  return (
    <div className="bg-slate-50">
      <Hero />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div>
            
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              {welcomeblog.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              {welcomeblog.heading}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {welcomeblog.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {welcomeblog.heroButton.map((button) => (
                <Link
                  key={button._key}
                  href={button.link}
                  className={
                    button.variant === "primary"
                      ? "rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                      : "rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  }
                >
                  {button.text}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 p-6 text-slate-300">
            <h3 className="text-xl font-semibold text-white">{welcomeblog.featertitle}</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7">
              {welcomeblog.homefeatures.map((feature, index) => (
                <li key={index}>
                  {feature.icon}
                  {feature.description}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}