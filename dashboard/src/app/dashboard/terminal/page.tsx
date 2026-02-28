"use client";

import TerminalChat from "@/components/Terminal";

export default function TerminalPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Terminal</h1>
        <p className="text-xs text-(--text-secondary) mt-1">
          Direct agent interface — natural language in, executed trades out
        </p>
      </div>
      <div className="h-[calc(100vh-180px)]">
        <TerminalChat />
      </div>
    </div>
  );
}
