"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronDown, Copy, Check } from "lucide-react";
import { useAccount } from "wagmi";
import { loadSettings } from "@/lib/settings";

interface WalletSelectorProps {
  totalBalance: string;
  chainCount: number;
  loading?: boolean;
}

function truncAddr(addr: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function WalletSelector({
  totalBalance,
  chainCount,
  loading,
}: WalletSelectorProps) {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const settings = typeof window !== "undefined" ? loadSettings() : null;
  const evmSA = settings?.evmSmartAccount || "";
  const solSA = settings?.solanaSmartAccount || "";
  const hasUA = !!evmSA;
  const walletCount = hasUA ? 1 : 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const copyAddr = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-visible rounded border border-border bg-card p-5 hover:border-border-bright transition-colors group"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Wallet size={16} className="text-(--green) opacity-60" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-(--text-secondary)">
            Total Balance
          </span>
        </div>

        {/* Wallet count badge */}
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-all ${
            open
              ? "border-(--green)/40 bg-(--green)/10 text-(--green)"
              : "border-border bg-elevated text-(--text-secondary) hover:border-border-bright hover:text-foreground"
          }`}
        >
          <span className="font-bold">{walletCount}</span>
          <Wallet size={13} />
          <ChevronDown
            size={11}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Balance */}
      <div className="text-2xl font-bold text-foreground glow-green">
        {loading ? "Loading..." : totalBalance}
      </div>
      <div className="mt-1 text-xs text-(--text-secondary)">
        {loading ? "" : `Across ${chainCount} chains`}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-lg border border-border bg-card shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-elevated/50">
              <span className="text-[10px] uppercase tracking-widest text-(--text-secondary)">
                Universal Accounts
              </span>
            </div>

            {/* UA Entry */}
            {hasUA ? (
              <div className="p-4">
                <div className="rounded-lg border border-border bg-elevated/30 p-4 space-y-3.5">
                  {/* UA header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--green)/10 border border-(--green)/20">
                        <Wallet size={15} className="text-(--green)" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">Universal Account</div>
                        <div className="text-xs text-(--text-secondary)">Primary</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-(--text-secondary)">Total Bal.</div>
                      <div className="text-sm font-bold text-foreground">{totalBalance}</div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* EVM address pill */}
                    <button
                      onClick={() => copyAddr(evmSA, "evm")}
                      className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-mono text-(--text-secondary) hover:border-(--green)/40 hover:text-foreground transition-all group/pill"
                      title={evmSA}
                    >
                      <span className="text-[10px] font-bold tracking-wider text-(--green) uppercase">evm</span>
                      <span>{truncAddr(evmSA)}</span>
                      {copiedField === "evm" ? (
                        <Check size={11} className="text-(--green)" />
                      ) : (
                        <Copy size={11} className="opacity-40 group-hover/pill:opacity-100 transition-opacity" />
                      )}
                    </button>

                    {/* Solana address pill */}
                    {solSA && (
                      <button
                        onClick={() => copyAddr(solSA, "sol")}
                        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-mono text-(--text-secondary) hover:border-(--green)/40 hover:text-foreground transition-all group/pill"
                        title={solSA}
                      >
                        <span className="text-[10px] font-bold tracking-wider text-(--green) uppercase">sol</span>
                        <span>{truncAddr(solSA)}</span>
                        {copiedField === "sol" ? (
                          <Check size={11} className="text-(--green)" />
                        ) : (
                          <Copy size={11} className="opacity-40 group-hover/pill:opacity-100 transition-opacity" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* EOA (signer) */}
                  {address && (
                    <div className="flex items-center gap-2.5 pt-2.5 border-t border-border">
                      <span className="text-[10px] uppercase tracking-widest text-(--text-secondary) font-semibold">Signer</span>
                      <span className="text-xs font-mono text-foreground/70">{truncAddr(address)}</span>
                      <button
                        onClick={() => copyAddr(address, "eoa")}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                      >
                        {copiedField === "eoa" ? (
                          <Check size={11} className="text-(--green)" />
                        ) : (
                          <Copy size={11} className="text-(--text-secondary)" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-(--text-secondary)">No Universal Account initialized yet.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
