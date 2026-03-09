import type { ReactNode } from "react";
import Link from "next/link";
import { AudioLines, ClipboardList, Gauge, Radio, Repeat2, Settings2, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/jobs/new", label: "New Job", icon: Radio },
  { href: "/jobs", label: "Jobs", icon: ClipboardList },
  { href: "/templates", label: "Templates", icon: Workflow },
  { href: "/field-recorder", label: "Field Recorder", icon: AudioLines },
  { href: "/reconform", label: "ReConform", icon: Repeat2 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-background text-foreground">
      <aside className="border-r border-border bg-panel px-3 py-4">
        <div className="mb-4 border-b border-border pb-3">
          <h1 className="text-sm font-semibold tracking-wide">Conform Bridge</h1>
          <p className="mt-1 text-xs text-muted">Resolve → Nuendo Operator Console</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted transition hover:bg-panelAlt hover:text-foreground")}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="p-5">
        <header className="mb-5 flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted">Mode: Intake + Canonical Planning (Nuendo writer pending)</p>
        </header>
        {children}
      </main>
    </div>
  );
}
