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
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {sectionTitle && (
          <h2 className="mb-10 text-center text-3xl font-semibold text-slate-900 sm:text-4xl">
            {sectionTitle}
          </h2>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const iconName = resolveIcon(stat.icon);
            return (
              <div
                key={stat._key}
                className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
              >
                {iconName && (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon icon={iconName} className="h-6 w-6" />
                  </span>
                )}
                <p className="text-4xl font-bold text-slate-900">
                  {stat.blogmetrics.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
