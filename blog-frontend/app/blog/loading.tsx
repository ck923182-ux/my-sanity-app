export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />

        <div className="mt-4 h-10 w-80 animate-pulse rounded bg-slate-200" />

        <div className="mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_0.7fr]">
        <section className="space-y-6">
          <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
        </section>

        <aside>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        </aside>
      </div>
    </main>
  );
}