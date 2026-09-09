import Link from "next/link";
import { Icon } from "@iconify/react";
import { client } from "@/lib/sanity";
import { HOME_PAGE_QUERY, THEME_COLORS_QUERY } from "@/lib/queries";
import type { HomePage } from "./types/home";
import type { ThemeColor } from "./types/pageBuilder";
import BlockRenderer from "./components/BlockRenderer";
import { ThemeProvider } from "./context/ThemeContext";

export default async function Home() {
  const [homepage, palette] = await Promise.all([
    client.fetch<HomePage>(HOME_PAGE_QUERY),
    client.fetch<ThemeColor[]>(THEME_COLORS_QUERY),
  ]);

  // Safe fallbacks so the page never crashes on empty Sanity data
  const welcomeblog = homepage?.welcomeblog ?? {};
  const pageBuilder = homepage?.pageBuilder ?? [];

  return (
    <ThemeProvider palette={palette ?? []}>
      <div className="bg-slate-50">
        {/* ── Welcome / intro section (welcomeblog singleton field) ── */}
        {welcomeblog?.heading && (
          <main className="relative overflow-hidden bg-white">
            {/* Background decoration */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-slate-100/70 blur-3xl" />
            </div>

            <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
              <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
                {/* Left Content */}
                <div>
                  {welcomeblog.eyebrow && (
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                      {welcomeblog.eyebrow}
                    </div>
                  )}

                  <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                    {welcomeblog.heading}
                  </h1>

                  {welcomeblog.description && (
                    <p className="mt-6 max-w-2xl text-base leading-8  sm:text-lg">
                      {welcomeblog.description}
                    </p>
                  )}

                  {welcomeblog.heroButton?.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-3">
                      {welcomeblog.heroButton.map((button) => (
                        <Link
                          key={button._key}
                          href={button.link}
                          className={
                            button.variant === "primary"
                              ? "inline-flex items-center rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                              : "inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                          }
                        >
                          {button.text}
                          <span className="ml-2">→</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Small trust/content indicator */}
                  <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Fresh content
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                     Expert perspectives
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                     Practical guide
                    </span>
                  </div>
                </div>

                {/* Right Feature Card */}
                {(welcomeblog.featertitle ||
                  welcomeblog.homefeatures?.length > 0) && (
                  <div className="relative">
                    {/* Decorative card behind */}
                    <div className="absolute -inset-3 rounded-[2rem] bg-slate-100 rotate-2" />

                    <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-9">
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg">
                            ✦
                          </div>

                          {welcomeblog.featertitle && (
                            <h2 className="text-2xl font-semibold tracking-tight">
                              {welcomeblog.featertitle}
                            </h2>
                          )}
                        </div>

                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                          Benefits
                        </span>
                      </div>

                      {/* Features */}
                      {welcomeblog.homefeatures?.length > 0 && (
                        <ul className="mt-8 space-y-4">
                          {welcomeblog.homefeatures.map((feature, index) => {
                            const iconName =
                              typeof (feature.icon as any)?.icon === "string"
                                ? (feature.icon as any).icon
                                : ((feature.icon as any)?.icon?.name ?? null);

                            return (
                              <li
                                key={feature._key ?? index}
                                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.08]"
                              >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
                                  {iconName ? (
                                    <Icon
                                      icon={iconName}
                                      className="h-4 w-4 text-white"
                                    />
                                  ) : (
                                    <span className="text-sm">✓</span>
                                  )}
                                </div>

                                <div className="pt-1">
                                  <p className="text-sm font-medium leading-6 text-slate-200">
                                    {feature.description}
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Bottom decoration */}
                      <div className="mt-8 border-t border-white/10 pt-6 text-white">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 text-white">
                          Read • Learn • Explore
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </main>
        )}

        {/* ── Page Builder blocks (heroSection, twocolumn, etc.) ── */}
        {pageBuilder.length > 0 && <BlockRenderer blocks={pageBuilder} />}
      </div>
    </ThemeProvider>
  );
}
