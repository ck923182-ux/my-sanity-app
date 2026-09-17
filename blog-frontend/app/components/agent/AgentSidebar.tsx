"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Overview",
    href: "/agent",
    icon: "▦",
  },
  {
    name: "API Health",
    href: "/agent/stats",
    icon: "◉",
  },
  {
    name: "Request Logs",
    href: "/agent/logs",
    icon: "≡",
  },
  {
    name: "AI Diagnosis",
    href: "/agent/health-ai",
    icon: "✦",
  },
];

export function AgentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 text-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        {/* Logo */}
        <div className="border-b border-slate-800 px-6 py-5">
          <Link href="/agent" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-950">
              AI
            </div>

            <div>
              <div className="text-sm font-semibold">Agent</div>
              <div className="text-xs text-slate-400">
                API Intelligence
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Monitoring
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                item.href === "/agent"
                  ? pathname === "/agent"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center text-base">
                    {item.icon}
                  </span>

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="my-6 border-t border-slate-800" />

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            System
          </p>

          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400">
              <span className="w-5 text-center">●</span>
              Monitoring Active
            </div>
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-800 p-4">
          <div className="rounded-lg bg-slate-900 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-xs font-medium text-slate-300">
                Agent Online
              </span>
            </div>

            <p className="mt-1 text-[11px] text-slate-500">
              API monitoring is active
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}