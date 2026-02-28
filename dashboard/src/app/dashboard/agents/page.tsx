"use client";

import { motion } from "framer-motion";
import { Bot, AlertCircle, Loader2, ExternalLink, RefreshCw, Wallet } from "lucide-react";
import StatusDot from "@/components/StatusDot";
import { useBalance, useHistory, useHealth } from "@/hooks/useApi";
import { useSettings } from "@/context/SettingsContext";
import { getTxLog } from "@/lib/txlog";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function AgentsPage() {
  const { settings, connection } = useSettings();
  const { isConnected } = useAccount();
  const { data: balance, loading: balLoading, error: balError, refetch: refetchBal } = useBalance();
  const { data: history, loading: histLoading } = useHistory(1, 100);
  const { data: health } = useHealth();
  const txLog = typeof window !== "undefined" ? getTxLog() : [];

  const isConfigured = !!settings.ownerAddress;
  const isOnline = connection.connected && isConfigured;
  const totalUSD = balance ? Number(balance.totalBalanceUSD || 0) : 0;
  const totalFormatted = `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const txCount = txLog.length || (history?.items.length ?? 0);
  const activeChains = balance
    ? [...new Set(balance.assets.flatMap((a) => a.chains.map((c) => c.chain)))].slice(0, 5)
    : [];

  if (!isConfigured || !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Wallet size={32} className="text-(--text-muted)" />
        <p className="text-sm text-(--text-secondary)">Connect your wallet to activate your agent</p>
        <ConnectButton />
      </div>
    );
  }

  if (balError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle size={32} className="text-(--red)" />
        <p className="text-sm text-(--text-secondary)">{balError}</p>
        <Link href="/dashboard/settings" className="text-xs text-(--green) hover:underline uppercase tracking-widest">
          Check Settings →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Agent</h1>
          <p className="text-xs text-(--text-secondary) mt-1">
            Your autonomous trading agent instance
          </p>
        </div>
        <button
          onClick={refetchBal}
          className="flex items-center gap-2 rounded border border-border px-4 py-2 text-xs uppercase tracking-widest text-(--text-secondary) hover:border-(--green) hover:text-(--green) transition-all"
        >
          <RefreshCw size={12} className={balLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Single Agent Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded border border-border bg-card p-5 hover:border-border-bright transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded border border-border bg-elevated">
              <Bot size={18} className="text-(--green)" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-sm font-bold text-foreground">
                  UniAgent
                </h3>
                <StatusDot status={isOnline ? "online" : "offline"} label={isOnline ? "online" : "offline"} />
              </div>
              <div className="text-[10px] text-(--text-muted) font-mono">
                {settings.ownerAddress}
              </div>
              {activeChains.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {activeChains.map((chain) => (
                    <span
                      key={chain}
                      className="rounded border border-border px-2 py-0.5 text-[9px] uppercase tracking-widest text-(--text-secondary)"
                    >
                      {chain}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-(--text-muted) mb-1">
              Balance
            </div>
            <div className="text-sm font-bold text-foreground">
              {balLoading ? "..." : totalFormatted}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-(--text-muted) mb-1">
              Transactions
            </div>
            <div className="text-sm font-bold text-foreground">
              {histLoading ? "..." : txCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-(--text-muted) mb-1">
              Chains
            </div>
            <div className="text-sm font-bold text-foreground">
              {activeChains.length}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-(--text-muted) mb-1">
              Backend
            </div>
            <div className={`text-sm font-bold ${health?.status === "ok" ? "text-(--green)" : "text-(--red)"}`}>
              {health?.status === "ok" ? "Connected" : "Offline"}
            </div>
          </div>
        </div>

        {/* Smart Account Info */}
        {(settings.evmSmartAccount || settings.solanaSmartAccount) && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[9px] uppercase tracking-widest text-(--text-muted) mb-2">
              Smart Accounts
            </div>
            <div className="space-y-1">
              {settings.evmSmartAccount && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-(--text-secondary)">
                  <span className="text-(--text-muted) w-8">EVM</span>
                  <span className="truncate">{settings.evmSmartAccount}</span>
                </div>
              )}
              {settings.solanaSmartAccount && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-(--text-secondary)">
                  <span className="text-(--text-muted) w-8">SOL</span>
                  <span className="truncate">{settings.solanaSmartAccount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-border flex gap-3">
          <Link
            href="/dashboard/terminal"
            className="flex items-center gap-2 rounded border border-(--green) px-4 py-2 text-[10px] uppercase tracking-widest text-(--green) hover:bg-(--green) hover:text-black transition-all"
          >
            Open Terminal
          </Link>
          <Link
            href="/dashboard/portfolio"
            className="flex items-center gap-2 rounded border border-border px-4 py-2 text-[10px] uppercase tracking-widest text-(--text-secondary) hover:border-border-bright transition-all"
          >
            View Portfolio
          </Link>
          {balance?.evmAddress && (
            <a
              href={`https://universalx.app/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded border border-border px-4 py-2 text-[10px] uppercase tracking-widest text-(--text-secondary) hover:border-border-bright transition-all"
            >
              Universal X <ExternalLink size={10} />
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}
