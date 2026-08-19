import Link from "next/link";
import { Icon } from "@iconify/react";
import { client } from "@/lib/sanity";
import { HOME_PAGE_QUERY } from "@/lib/queries";
import type { HomePage } from "./types/home";
import BlockRenderer from "./components/BlockRenderer";

export default async function Home() {
  const homepage: HomePage = await client.fetch(HOME_PAGE_QUERY);

  // Safe fallbacks so the page never crashes on empty Sanity data
  const welcomeblog = homepage?.welcomeblog ?? {};
  const pageBuilder = homepage?.pageBuilder ?? [];

  return (
    <div className="bg-slate-50">

      {/* ── Welcome / intro section (welcomeblog singleton field) ── */}
      {welcomeblog.heading && (
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              {welcomeblog.eyebrow && (
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {welcomeblog.eyebrow}
                </p>
              )}
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                {welcomeblog.heading}
              </h2>
              {welcomeblog.description && (
                <p className="mt-5 text-lg leading-8 text-slate-600">
                  {welcomeblog.description}
                </p>
              )}
              {welcomeblog.heroButton && welcomeblog.heroButton.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {welcomeblog.heroButton.map((button) => (
                    <Link
                      key={button._key}
                      href={button.link}
                      className={
                        button.variant === "primary"
                          ? "rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                          : "rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                      }
                    >
                      {button.text}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {(welcomeblog.featertitle || welcomeblog.homefeatures?.length > 0) && (
              <div className="rounded-3xl bg-slate-900 p-6 text-slate-300">
                {welcomeblog.featertitle && (
                  <h3 className="text-xl font-semibold text-white">
                    {welcomeblog.featertitle}
                  </h3>
                )}
                <ul className="mt-4 space-y-3 text-sm leading-7">
                  {welcomeblog.homefeatures?.map((feature, index) => {
                    const iconName =
                      typeof (feature.icon as any)?.icon === "string"
                        ? (feature.icon as any).icon
                        : (feature.icon as any)?.icon?.name ?? null;

                    return (
                      <li key={feature._key ?? index} className="flex items-center gap-2">
                        {iconName && (
                          <Icon icon={iconName} className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        )}
                        <span>{feature.description}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        </main>
      )}

      {/* ── Page Builder blocks (heroSection, twocolumn, etc.) ── */}
      {pageBuilder.length > 0 && (
        <BlockRenderer blocks={pageBuilder} />
      )}

    </div>
  );
}
