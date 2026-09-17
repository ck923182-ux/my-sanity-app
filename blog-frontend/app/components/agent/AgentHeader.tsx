export function AgentHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex min-h-16 items-center justify-between px-6 lg:px-8">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Agent Dashboard
          </h1>

          <p className="text-xs text-slate-500">
            API monitoring and AI diagnostics
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          <span className="text-xs font-medium text-emerald-700">
            System Online
          </span>
        </div>
      </div>
    </header>
  );
}