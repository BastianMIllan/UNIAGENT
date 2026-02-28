"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  delay?: number;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  sub,
  delay = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded border border-border bg-card p-5 hover:border-border-bright transition-colors group"
    >
      {/* corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8">
        <div className="absolute top-0 right-0 w-full h-px bg-(--green) opacity-30 group-hover:opacity-60 transition-opacity" />
        <div className="absolute top-0 right-0 h-full w-px bg-(--green) opacity-30 group-hover:opacity-60 transition-opacity" />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Icon size={16} className="text-(--green) opacity-60" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-(--text-secondary)">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-foreground glow-green">
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs text-(--text-secondary)">{sub}</div>
      )}
    </motion.div>
  );
}
