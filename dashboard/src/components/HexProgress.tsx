"use client";

import { motion } from "framer-motion";

interface Props {
  label: string;
  value: number;        // 0-100
  color?: string;
  className?: string;
}

export default function HexProgress({
  label,
  value,
  color = "var(--green)",
  className = "",
}: Props) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="var(--border)"
            strokeWidth="2"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-(--text-secondary)">
        {label}
      </span>
    </div>
  );
}
