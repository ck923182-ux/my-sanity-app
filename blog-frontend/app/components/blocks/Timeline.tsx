"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { urlFor } from "@/lib/image";
import type { TimelineBlock, TimelineItem } from "@/app/types/pageBuilder";

// ─── Icon resolver ────────────────────────────────────────────────────────────

function resolveIcon(icon?: TimelineItem["icon"]): string | null {
  if (!icon) return null;
  if (typeof icon.icon === "string") return icon.icon;
  if (typeof icon.icon === "object" && icon.icon?.name) return icon.icon.name;
  if (typeof icon.name === "string") return icon.name;
  return null;
}

// ─── Single card ─────────────────────────────────────────────────────────────

function TimelineCard({ item, side }: { item: TimelineItem; side: "left" | "right" }) {
  const iconName = resolveIcon(item.icon);

  return (
    <div
      className={`w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${
        side === "left" ? "ml-auto" : "mr-auto"
      }`}
    >
      {/* Year badge */}
      <span className="inline-block rounded bg-red-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-white">
        {item.year}
      </span>

      {/* Heading */}
      {item.heading && (
        <h3 className="mt-3 text-base font-semibold text-slate-900">{item.heading}</h3>
      )}

      {/* Icon */}
      {iconName && !item.image && (
        <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon icon={iconName} className="h-5 w-5" />
        </div>
      )}

      {/* Image */}
      {item.image && (
        <div className="relative mt-3 aspect-video overflow-hidden rounded-xl bg-slate-100">
          <Image
            src={urlFor(item.image).width(600).height(340).url()}
            alt={item.heading ?? item.year}
            fill
            className="object-cover"
            sizes="300px"
          />
        </div>
      )}

      {/* Bullet points */}
      {item.points && item.points.length > 0 && (
        <ul className="mt-4 space-y-2">
          {item.points.map((point) => (
            <li key={point._key} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
              {point.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main block ───────────────────────────────────────────────────────────────

export default function Timeline({ block }: { block: TimelineBlock }) {
  const { sectionTitle, items } = block;

  // scroll-driven progress for the centre line
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      // how far the section has been scrolled through the viewport
      const scrolled = windowH - rect.top;
      const total = rect.height + windowH;
      const pct = Math.min(Math.max(scrolled / total, 0), 1);
      setProgress(pct);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initialise on mount
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section ref={sectionRef} className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {sectionTitle && (
          <h2 className="mb-14 text-center text-3xl font-semibold text-slate-900 sm:text-4xl">
            {sectionTitle}
          </h2>
        )}

        <div className="relative">

          {/* ── Static grey track ── */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-200"
            aria-hidden="true"
          />

          {/* ── Red scroll-progress fill ── */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 w-0.5 -translate-x-1/2 bg-red-500 transition-none"
            style={{ height: `${progress * 100}%` }}
            aria-hidden="true"
          />

          {/* ── Items ── */}
          <ol className="space-y-12">
            {items.map((item, index) => {
              const isLeft = index % 2 === 0;

              return (
                <li key={item._key} className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-6">

                  {/* Left cell */}
                  <div className="flex justify-end">
                    {isLeft && <TimelineCard item={item} side="left" />}
                  </div>

                  {/* Centre dot */}
                  <div className="relative z-10 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                  </div>

                  {/* Right cell */}
                  <div className="flex justify-start">
                    {!isLeft && <TimelineCard item={item} side="right" />}
                  </div>

                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
