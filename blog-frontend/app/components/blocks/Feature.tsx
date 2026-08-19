import { Icon } from "@iconify/react";
import type { FeatureBlock } from "@/app/types/pageBuilder";

function resolveIcon(icon?: FeatureBlock["icon"]): string | null {
  if (!icon) return null;
  if (typeof icon.icon === "string") return icon.icon;
  if (typeof icon.icon === "object" && icon.icon?.name) return icon.icon.name;
  if (typeof icon.name === "string") return icon.name;
  return null;
}

export default function Feature({ block }: { block: FeatureBlock }) {
  const iconName = resolveIcon(block.icon);

  return (
    <div className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md">
      {iconName && (
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
          <Icon icon={iconName} className="h-5 w-5" />
        </span>
      )}
      <p className="text-sm leading-7 text-slate-600">{block.description}</p>
    </div>
  );
}
