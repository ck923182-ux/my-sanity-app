
import { AgentHeader } from "@/app/components/agent/AgentHeader";
import { AgentSidebar } from "@/app/components/agent/AgentSidebar";
import { requireAdmin } from "@/auth/guards";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify the administrator's session before rendering.
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AgentSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AgentHeader />

          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
