"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ArrowRightLeft,
  Send,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useHistory } from "@/hooks/useApi";
import { getTxLog, type TxLogEntry } from "@/lib/txlog";
import Link from "next/link";

const TYPE_ICON: Record<string, typeof ArrowUpRight> = {
  BUY: ArrowUpRight,
  SELL: ArrowDownRight,
  CONVERT: RefreshCw,
  TRANSFER: Send,
  TX: ArrowRightLeft,
};

const TYPE_COLOR: Record<string, string> = {
  BUY: "text-(--green) border-(--green)",
  SELL: "text-(--red) border-(--red)",
  CONVERT: "text-cyan border-cyan",
  TRANSFER: "text-(--yellow) border-(--yellow)",
  TX: "text-(--text-secondary) border-border",
};

type TxFilter = "ALL" | "BUY" | "SELL" | "CONVERT" | "TRANSFER";

interface DisplayTx {
  id: string;
  type: string;
  asset: string;
  chain: string;
  amount: string;
  time: string;
  status: string;
  explorerUrl?: string;
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<TxFilter>("ALL");
  const [page, setPage] = useState(1);
  const { data: history, loading, error, refetch } = useHistory(page, 20);
  const txLog = typeof window !== "undefined" ? getTxLog() : [];

  // Merge: prefer local tx log (has enriched data), backfill from backend
  const transactions: DisplayTx[] = (() => {
    const merged: DisplayTx[] = [];
    const seenIds = new Set<string>();

    // Local log entries first
    for (const entry of txLog) {
      merged.push({
        id: entry.transactionId || entry.rootHash.slice(0, 10) + "...",
        type: entry.type,
        asset: entry.asset,
        chain: entry.chain,
        amount: entry.amount,
        time: formatTimeAgo(entry.createdAt),
        status: entry.status,
        explorerUrl: entry.explorerUrl,
      });
      if (entry.transactionId) seenIds.add(entry.transactionId);
    }

    // Backend history entries (if not already in log)
    if (history?.items) {
      for (const item of history.items) {
        if (!seenIds.has(item.transactionId)) {
          merged.push({
            id: item.transactionId.slice(0, 10) + "...",
            type: "TX",
            asset: "",
            chain: "",
            amount: "",
            time: item.createdAt ? formatTimeAgo(new Date(item.createdAt).getTime()) : "—",
            status: item.status || "unknown",
            explorerUrl: item.explorerUrl,
          });
        }
      }
    }

    return merged;
  })();

  const filtered = filter === "ALL" ? transactions : transactions.filter((tx) => tx.type === filter);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle size={32} className="text-(--red)" />
        <p className="text-sm text-(--text-secondary)">{error}</p>
        <Link href="/dashboard/settings" className="text-xs text-(--green) hover:underline uppercase tracking-widest">
          Go to Settings →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Activity</h1>
          <p className="text-xs text-(--text-secondary) mt-1">
            Transaction history across all chains
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(["ALL", "BUY", "SELL", "CONVERT", "TRANSFER"] as TxFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded transition-colors ${
                filter === f
                  ? "text-(--green) bg-(--green-glow)"
                  : "text-(--text-muted) hover:text-(--text-secondary)"
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={refetch}
            className="p-1 rounded hover:bg-white/5 transition-colors text-(--text-muted)"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="rounded border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 border-b border-border px-4 py-2 bg-elevated text-[10px] uppercase tracking-widest text-(--text-muted)">
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Asset</div>
          <div className="col-span-2">Chain</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Tx Hash</div>
          <div className="col-span-1 text-right">Time</div>
        </div>

        {/* Rows */}
        {loading && filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-(--green)" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-xs text-(--text-muted)">
            No transactions yet. Use the terminal to create your first trade.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((tx, i) => {
              const Icon = TYPE_ICON[tx.type] || ArrowRightLeft;
              const color = TYPE_COLOR[tx.type] || TYPE_COLOR.TX;

              return (
                <motion.div
                  key={`${tx.id}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="grid grid-cols-12 gap-4 px-4 py-3 text-xs hover:bg-elevated transition-colors items-center"
                >
                  <div className="col-span-1">
                    <div className={`flex items-center justify-center w-7 h-7 rounded border bg-transparent ${color}`}>
                      <Icon size={12} />
                    </div>
                  </div>
                  <div className="col-span-2 font-bold text-foreground uppercase">
                    {tx.asset || "—"}
                  </div>
                  <div className="col-span-2 text-(--text-secondary)">
                    {tx.chain || "—"}
                  </div>
                  <div className="col-span-2 text-foreground">
                    {tx.amount || "—"}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`text-[10px] uppercase tracking-widest ${
                        tx.status === "confirmed" || tx.status === "success"
                          ? "text-(--green)"
                          : tx.status === "pending"
                          ? "text-(--yellow)"
                          : tx.status === "failed"
                          ? "text-(--red)"
                          : "text-(--text-muted)"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div className="col-span-2 font-mono text-(--text-muted)">
                    {tx.explorerUrl ? (
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-(--green) transition-colors"
                      >
                        {tx.id} <ExternalLink size={10} />
                      </a>
                    ) : (
                      tx.id
                    )}
                  </div>
                  <div className="col-span-1 text-right text-(--text-muted)">
                    {tx.time}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {history && history.items.length >= 20 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-[10px] uppercase tracking-widest text-(--text-secondary) hover:text-(--green) disabled:opacity-30 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-[10px] text-(--text-muted)">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="text-[10px] uppercase tracking-widest text-(--text-secondary) hover:text-(--green) transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
