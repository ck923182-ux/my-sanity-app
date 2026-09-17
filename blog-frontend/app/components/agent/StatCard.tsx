interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: string;
}

export function StatCard({
  label,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg">
          {icon}
        </div>
      </div>

      {description && (
        <p className="mt-3 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}