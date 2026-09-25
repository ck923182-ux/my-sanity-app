export default function ParallelDemoLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <h1 className="text-3xl font-bold">Parallel demo</h1>

        <div>{children}</div>

        <div className="grid gap-6 md:grid-cols-2">
          {analytics}
          {team}
        </div>
      </div>
    </>
  );
}
