import { Icon } from "@iconify/react";
import type { BlogStatsBlock, StatItem } from "@/app/types/pageBuilder";

function resolveIcon(icon?: StatItem["icon"]): string | null {
  if (!icon) return null;
  if (typeof icon.icon === "string") return icon.icon;
  if (typeof icon.icon === "object" && icon.icon?.name) return icon.icon.name;
  if (typeof icon.name === "string") return icon.name;
  return null;
}

export default function BlogStats({ block }: { block: BlogStatsBlock }) {
  const { sectionTitle, stats } = block;

  if (!stats || stats.length === 0) return null;

  return (
    <section className="blog-stats mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {sectionTitle && (
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          {sectionTitle}
        </h2>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const iconName = resolveIcon(stat.icon);
          return (
            <div
              key={stat._key}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-lg"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {iconName && (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                  <Icon icon={iconName} className="h-6 w-6" />
                </span>
              )}
              <p className="text-4xl font-bold tabular-nums">
                {stat.blogmetrics.toLocaleString()}
              </p>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
