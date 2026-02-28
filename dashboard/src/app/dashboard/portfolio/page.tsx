"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, AlertCircle, Loader2, Wallet } from "lucide-react";
import { useBalance } from "@/hooks/useApi";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function PortfolioPage() {
  const { isConnected } = useAccount();
  const { data: balance, loading, error } = useBalance();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Wallet size={32} className="text-(--text-muted)" />
        <p className="text-sm text-(--text-secondary)">Connect your wallet to view portfolio</p>
        <ConnectButton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle size={32} className="text-(--red)" />
        <p className="text-sm text-(--text-secondary)">{error}</p>
        <Link href="/dashboard/settings" className="text-xs text-(--green) hover:underline uppercase tracking-widest">
          Check Settings →
        </Link>
      </div>
    );
  }

  if (loading || !balance) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-(--green)" />
      </div>
    );
  }

  const totalUSD = Number(balance.totalBalanceUSD || 0);
  const totalFormatted = `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Build assets list from real data
  const assets = balance.assets.map((a) => {
    const chainLabel =
      a.chains.length > 2
        ? `${a.chains.length} chains`
        : a.chains.map((c) => c.chain).join(", ") || "—";
    return {
      symbol: a.symbol,
      name: a.name,
      balance: String(a.totalAmount),
      usd: `$${Number(a.totalAmountInUSD).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      chain: chainLabel,
    };
  });

  // Build chain breakdown from real data
  const chainMap: Record<string, number> = {};
  for (const asset of balance.assets) {
    for (const c of asset.chains) {
      // Estimate USD proportionally
      const assetTotal = Number(asset.totalAmount) || 1;
      const assetUSD = Number(asset.totalAmountInUSD) || 0;
      const chainAmount = Number(c.amount) || 0;
      const chainUSD = assetTotal > 0 ? (chainAmount / assetTotal) * assetUSD : 0;
      chainMap[c.chain] = (chainMap[c.chain] || 0) + chainUSD;
    }
  }
  const chainBreakdown = Object.entries(chainMap)
    .sort((a, b) => b[1] - a[1])
    .map(([chain, value]) => ({
      chain,
      value: `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pct: totalUSD > 0 ? Math.round((value / totalUSD) * 100) : 0,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-xs text-(--text-secondary) mt-1">
          Cross-chain asset overview
        </p>
      </div>

      {/* Total */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded border border-border bg-card p-6"
      >
        <div className="text-[10px] uppercase tracking-widest text-(--text-secondary) mb-2">
          Total Portfolio Value
        </div>
        <div className="text-3xl font-bold glow-green">{totalFormatted}</div>
        <div className="flex items-center gap-2 mt-1 text-sm text-(--text-muted)">
          <ArrowUpRight size={14} />
          Live balance from Particle Network
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Assets table */}
        <div className="lg:col-span-2 rounded border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-2 bg-elevated">
            <span className="text-[10px] uppercase tracking-widest text-(--text-secondary)">
              Assets ({assets.length})
            </span>
          </div>
          {assets.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-(--text-muted)">
              No assets found. Deposit funds to your smart account to get started.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {assets.map((asset, i) => (
                <motion.div
                  key={asset.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-elevated transition-colors"
                >
                  <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-[10px] font-bold text-(--green)">
                    {asset.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-foreground">
                      {asset.symbol}
                    </div>
                    <div className="text-[10px] text-(--text-muted)">
                      {asset.chain}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-foreground">
                      {asset.balance}
                    </div>
                    <div className="text-[10px] text-(--text-secondary)">
                      {asset.usd}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Chain breakdown */}
        <div className="rounded border border-border bg-card p-5">
          <div className="text-[10px] uppercase tracking-widest text-(--text-secondary) mb-4">
            Chain Breakdown
          </div>
          {chainBreakdown.length === 0 ? (
            <p className="text-xs text-(--text-muted)">No chain data</p>
          ) : (
            <div className="space-y-3">
              {chainBreakdown.map((item, i) => (
                <motion.div
                  key={item.chain}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground">{item.chain}</span>
                    <span className="text-(--text-secondary)">{item.value}</span>
                  </div>
                  <div className="h-1 rounded-full bg-elevated overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-(--green)"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
