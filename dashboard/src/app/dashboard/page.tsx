"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import WalletSelector from "@/components/WalletSelector";
import HexProgress from "@/components/HexProgress";
import NetworkGraph from "@/components/NetworkGraph";
import { useBalance, useHistory } from "@/hooks/useApi";
import { getTxLog } from "@/lib/txlog";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function DashboardOverview() {
  const { isConnected } = useAccount();
  const { data: balance, loading: balLoading, error: balError } = useBalance();
  const { data: history, loading: histLoading } = useHistory(1, 10);
  const txLog = typeof window !== "undefined" ? getTxLog() : [];

  // Compute stats from real data
  const totalBalance = balance ? `$${Number(balance.totalBalanceUSD).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$—";
  const chainCount = balance ? new Set(balance.assets.flatMap((a) => a.chains.map((c) => c.chain))).size : 0;
  const totalChains = 21;
  const chainNames = balance
    ? [...new Set(balance.assets.flatMap((a) => a.chains.map((c) => c.chain)).filter(Boolean))]
        .slice(0, 4)
        .join(", ") || "Ready"
    : "—";
  const txCount = history ? history.items.length.toString() : "—";

  // Asset allocation from real balance
  const allocationData = balance && balance.assets.length > 0
    ? (() => {
        const total = balance.assets.reduce((s, a) => s + Number(a.totalAmountInUSD || 0), 0);
        if (total === 0) return [{ label: "Empty", value: 0 }];
        const sorted = [...balance.assets].sort((a, b) => Number(b.totalAmountInUSD) - Number(a.totalAmountInUSD));
        const top2 = sorted.slice(0, 2).map((a) => ({
          label: a.symbol,
          value: Math.round((Number(a.totalAmountInUSD) / total) * 100),
        }));
        const otherPct = 100 - top2.reduce((s, x) => s + x.value, 0);
        if (otherPct > 0) top2.push({ label: "Other", value: otherPct });
        return top2;
      })()
    : [];

  // Merge tx log with history for recent tx display
  const recentTxs = txLog.length > 0
    ? txLog.slice(0, 5).map((tx) => ({
        type: tx.type,
        asset: tx.asset,
        chain: tx.chain,
        amount: tx.amount,
        time: formatTimeAgo(tx.createdAt),
        positive: tx.type === "BUY" || tx.type === "CONVERT" || tx.type === "TRANSFER",
      }))
    : history?.items.slice(0, 5).map((tx) => ({
        type: "TX",
        asset: "",
        chain: "",
        amount: tx.transactionId.slice(0, 10) + "...",
        time: tx.createdAt ? formatTimeAgo(new Date(tx.createdAt).getTime()) : "—",
        positive: tx.status === "confirmed" || tx.status === "success",
      })) || [];

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Wallet size={32} className="text-(--text-muted)" />
        <p className="text-sm text-(--text-secondary)">Connect your wallet to get started</p>
        <ConnectButton />
      </div>
    );
  }

  if (balError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle size={32} className="text-(--red)" />
        <p className="text-sm text-(--text-secondary)">{balError}</p>
        <Link
          href="/dashboard/settings"
          className="text-xs text-(--green) hover:underline uppercase tracking-widest"
        >
          Check Settings →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Overview</h1>
          <p className="text-xs text-(--text-secondary) mt-1">
            Autonomous agent performance across all chains
          </p>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-(--text-muted)">
          {balLoading ? "Syncing..." : "Live"}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WalletSelector
          totalBalance={balLoading ? "$—" : totalBalance}
          chainCount={chainCount}
          loading={balLoading}
        />
        <StatsCard
          icon={TrendingUp}
          label="24h P&L"
          value="—"
          sub="Price tracking N/A"
          delay={0.1}
        />
        <StatsCard
          icon={Activity}
          label="Transactions"
          value={histLoading ? "..." : txCount}
          sub="Recent"
          delay={0.2}
        />
        <StatsCard
          icon={Layers}
          label="Active Chains"
          value={`${chainCount} / ${totalChains}`}
          sub={chainNames || "—"}
          delay={0.3}
        />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="lg:col-span-2 rounded border border-border bg-card h-64 overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 bg-elevated">
            <span className="text-[10px] uppercase tracking-widest text-(--text-secondary)">
              Network Activity
            </span>
          </div>
          <NetworkGraph />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="rounded border border-border bg-card p-5"
        >
          <div className="text-[10px] uppercase tracking-widest text-(--text-secondary) mb-4">
            Allocation
          </div>
          {allocationData.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {allocationData.map((item, i) => (
                <HexProgress
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  color={i === 0 ? undefined : i === 1 ? "var(--cyan)" : "#666"}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-(--text-muted)">No assets yet</p>
          )}
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded border border-border bg-card overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-elevated">
          <span className="text-[10px] uppercase tracking-widest text-(--text-secondary)">
            Recent Transactions
          </span>
          <Link
            href="/dashboard/activity"
            className="text-[10px] text-(--text-muted) uppercase tracking-widest hover:text-(--green) transition-colors"
          >
            View all →
          </Link>
        </div>
        {recentTxs.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-(--text-muted)">
            {balLoading || histLoading ? (
              <Loader2 size={16} className="animate-spin mx-auto" />
            ) : (
              "No transactions yet. Use the terminal to start trading."
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentTxs.map((tx, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3 hover:bg-elevated transition-colors"
              >
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded border ${
                    tx.positive
                      ? "border-(--green) text-(--green)"
                      : "border-(--red) text-(--red)"
                  } bg-transparent`}
                >
                  {tx.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-foreground">
                      {tx.type}
                    </span>
                    <span className="text-[10px] text-(--text-secondary)">{tx.asset}</span>
                  </div>
                  <div className="text-[10px] text-(--text-muted)">{tx.chain}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-foreground">{tx.amount}</div>
                  <div className="text-[10px] text-(--text-muted)">{tx.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
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
