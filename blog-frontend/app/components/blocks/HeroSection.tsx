import Link from "next/link";
import type { HeroSectionBlock } from "@/app/types/pageBuilder";

export default function HeroSection({ block }: { block: HeroSectionBlock }) {
  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        {/* Left: copy */}
        <div className="max-w-2xl">
          {block.subheading && (
            <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium">
              {block.subheading}
            </p>
          )}

          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            {block.heading}
          </h1>

          {block.content && (
            <p className="mt-4 text-lg leading-8 text-slate-300">
              {block.content}
            </p>
          )}

          {block.heroButton && block.heroButton.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {block.heroButton.map((btn) => (
                <Link
                  key={btn._key}
                  href={btn.link}
                  className={
                    btn.variant === "primary"
                      ? "rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                      : "rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  }
                >
                  {btn.text}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: highlights card */}
        {block.Highlightscards && block.Highlightscards.length > 0 && (
          <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
            {block.Highlights && (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
                  {block.Highlights}
                </p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {block.Highlightscards.map((card, i) => (
                <div key={i} className="rounded-2xl bg-slate-900/60 p-4">
                  <p className="text-2xl font-semibold text-white">
                    {card.Highlightsnumber}
                  </p>
                  <p className="text-sm text-slate-400">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
