import Link from "next/link";
import type { HeroSectionBlock } from "@/app/types/pageBuilder";

export default function HeroSection({ block }: { block: HeroSectionBlock }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4 text-white sm:px-6 lg:px-8">
      {/* subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.4), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: copy */}
        <div className="max-w-2xl animate-fade-up">
          {block.subheading && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              {block.subheading}
            </p>
          )}

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {block.heading}
          </h1>

          {block.content && (
            <p className="mt-5 text-lg leading-8 text-slate-300">
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
                      ? "group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-200 hover:bg-slate-100 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                      : "group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:border-white/40 hover:-translate-y-0.5 active:translate-y-0"
                  }
                >
                  {btn.text}
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: stats card */}
        {block.Highlightscards && block.Highlightscards.length > 0 && (
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:w-auto">
            {block.Highlights && (
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {block.Highlights}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {block.Highlightscards.map((card, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-slate-900/60 p-4 transition-transform duration-200 hover:scale-[1.03]"
                >
                  <p className="text-2xl font-bold text-white">
                    {card.Highlightsnumber}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
