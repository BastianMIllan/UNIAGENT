"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Bot,
  Terminal,
  Wallet,
  Activity,
  Settings,
  Globe,
} from "lucide-react";
import StatusDot from "./StatusDot";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/agents", label: "Agents", icon: Bot },
  { href: "/dashboard/terminal", label: "Terminal", icon: Terminal },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/chains", label: "Chains", icon: Globe },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border bg-background overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <Image
          src="/logo.png"
          alt="UniAgent"
          width={56}
          height={56}
          className="rounded-lg"
        />
        <span className="text-base font-semibold tracking-tight text-foreground">
          UniAgent
        </span>
        <span className="ml-auto text-[9px] rounded-md border border-border-bright px-1.5 py-0.5 text-(--text-secondary) tracking-wide">
          v1
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                active
                  ? "text-foreground bg-elevated"
                  : "text-(--text-secondary) hover:text-foreground hover:bg-elevated"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r bg-green"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={15} className={active ? "text-green" : ""} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4 space-y-3">
        <StatusDot status="online" label="21 chains" />
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 text-xs text-(--text-secondary) hover:text-foreground transition-colors"
        >
          <Settings size={13} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
