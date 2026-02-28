"use client";

import { motion } from "framer-motion";
import StatusDot from "@/components/StatusDot";
import NetworkGraph from "@/components/NetworkGraph";
import { useChains, useHealth } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";

// Pretty names for chain slugs
const PRETTY_NAMES: Record<string, string> = {
  ethereum: "Ethereum", eth: "Ethereum",
  arbitrum: "Arbitrum", arb: "Arbitrum",
  optimism: "Optimism", op: "Optimism",
  base: "Base",
  polygon: "Polygon", matic: "Polygon",
  bsc: "BSC", bnb: "BSC",
  avalanche: "Avalanche", avax: "Avalanche",
  solana: "Solana", sol: "Solana",
  linea: "Linea",
  sonic: "Sonic",
  berachain: "Berachain", bera: "Berachain",
  mantle: "Mantle",
  monad: "Monad",
  merlin: "Merlin",
  hyperevm: "HyperEVM",
  blast: "Blast",
  manta: "Manta",
  mode: "Mode",
  plasma: "Plasma",
  xlayer: "X Layer",
  conflux: "Conflux",
};

export default function ChainsPage() {
  const { data: chainsData, loading } = useChains();
  const { data: health } = useHealth();

  // Deduplicate chains (backend has aliases like eth/ethereum)
  const uniqueChains = (() => {
    if (!chainsData) return [];
    const seen = new Map<number, { name: string; id: string; chainId: number }>();
    for (const [slug, chainId] of Object.entries(chainsData.chains)) {
      if (!seen.has(chainId)) {
        seen.set(chainId, {
          name: PRETTY_NAMES[slug] || slug.charAt(0).toUpperCase() + slug.slice(1),
          id: slug,
          chainId,
        });
      }
    }
    return Array.from(seen.values());
  })();

  const backendOnline = health?.status === "ok";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Chains</h1>
          <p className="text-xs text-(--text-secondary) mt-1">
            {loading ? "Loading..." : `${uniqueChains.length} supported chains`}
            {backendOnline ? " · Backend online" : ""}
          </p>
        </div>
      </div>

      {/* Network Graph */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="rounded border border-border bg-card h-64 overflow-hidden"
      >
        <NetworkGraph />
      </motion.div>

      {/* Chain Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-(--green)" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {uniqueChains.map((chain, i) => (
            <motion.div
              key={chain.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="rounded border border-border bg-card p-4 hover:border-border-bright transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {chain.name}
                </span>
                <StatusDot status={backendOnline ? "online" : "offline"} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-(--text-muted)">
                    Chain ID
                  </div>
                  <div className="text-xs text-(--text-secondary) font-mono">
                    {chain.chainId}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-(--text-muted)">
                    Status
                  </div>
                  <div className="text-xs text-(--text-secondary)">
                    {backendOnline ? "Available" : "Unknown"}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Supported Assets */}
      {chainsData && (
        <div className="rounded border border-border bg-card p-5">
          <div className="text-[10px] uppercase tracking-widest text-(--text-secondary) mb-3">
            Primary Assets
          </div>
          <div className="flex flex-wrap gap-2">
            {chainsData.primaryAssets.map((asset) => (
              <span
                key={asset}
                className="rounded border border-border px-3 py-1.5 text-xs font-bold text-(--green) uppercase tracking-wider"
              >
                {asset}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
