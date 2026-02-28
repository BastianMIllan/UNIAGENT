"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, Trash2, CheckCircle, AlertCircle, Copy, Wallet, Shield } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function SettingsPage() {
  const { settings, update, connection, checkConnection, initWallet } = useSettings();
  const { address, isConnected } = useAccount();

  const [backendUrl, setBackendUrl] = useState(settings.backendUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [saved, setSaved] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    setBackendUrl(settings.backendUrl);
    setApiKey(settings.apiKey);
  }, [settings]);

  const handleSave = () => {
    update({ backendUrl, apiKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTimeout(checkConnection, 200);
  };

  const handleInit = async () => {
    if (!settings.ownerAddress) return;
    setInitializing(true);
    try {
      await initWallet();
    } finally {
      setInitializing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs text-(--text-secondary) mt-1">
          Agent and backend configuration
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Connection Status Banner */}
        <div
          className={`flex items-center gap-3 rounded border px-4 py-3 text-xs ${
            connection.connected
              ? "border-(--green)/30 bg-(--green)/5 text-(--green)"
              : "border-(--red)/30 bg-(--red)/5 text-(--red)"
          }`}
        >
          {connection.connected ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          <span>
            {connection.checking
              ? "Checking connection..."
              : connection.connected
              ? `Connected to backend at ${settings.backendUrl}`
              : `Cannot reach backend${connection.error ? `: ${connection.error}` : ""}`}
          </span>
          <button
            onClick={checkConnection}
            className="ml-auto p-1 rounded hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={12} className={connection.checking ? "animate-spin" : ""} />
          </button>
        </div>

        {/* API Section */}
        <div className="rounded border border-border bg-card p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
            Backend Connection
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-(--text-secondary) mb-1.5">
                Backend URL
              </label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:3069"
                className="w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-border-bright transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-(--text-secondary) mb-1.5">
                API Key <span className="text-(--text-muted)">(optional)</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave empty if backend has no API_SECRET"
                className="w-full rounded border border-border bg-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-border-bright transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="rounded border border-border bg-card p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">
            Wallet
          </h2>

          {!isConnected ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <Wallet size={28} className="text-(--text-muted)" />
              <p className="text-xs text-(--text-secondary) text-center">
                Connect your wallet to derive a Universal Account for your agent.
              </p>
              <ConnectButton />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-(--text-secondary) mb-1.5">
                  Connected Wallet (EOA)
                </div>
                <div className="flex items-center gap-2 rounded border border-border bg-elevated px-3 py-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--green) opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-(--green)" />
                  </span>
                  <code className="text-sm text-foreground font-mono flex-1 truncate">
                    {address}
                  </code>
                  <button onClick={() => copyToClipboard(address || "")} className="p-1 hover:bg-white/5 rounded">
                    <Copy size={12} className="text-(--text-muted)" />
                  </button>
                </div>
              </div>

              {settings.evmSmartAccount ? (
                <div className="rounded-lg border border-(--green)/20 bg-(--green)/5 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-(--green)/10">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-(--green)/10 border border-(--green)/20">
                      <Shield size={13} className="text-(--green)" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-(--green)">
                        Universal Account
                      </span>
                      <span className="text-[8px] font-semibold uppercase tracking-widest text-(--green)/80 bg-(--green)/10 border border-(--green)/20 rounded-full px-1.5 py-px">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="p-4 space-y-2">
                    {/* EVM */}
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-elevated/50 px-3 py-2.5">
                      <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-(--cyan) bg-(--cyan)/10 border border-(--cyan)/15 rounded px-2 py-0.5">
                        EVM
                      </span>
                      <code className="text-[11px] text-foreground/80 font-mono flex-1 truncate">
                        {settings.evmSmartAccount}
                      </code>
                      <button onClick={() => copyToClipboard(settings.evmSmartAccount)} className="shrink-0 p-1.5 rounded-md hover:bg-white/5 transition-colors group/cp">
                        <Copy size={12} className="text-(--text-muted) group-hover/cp:text-(--green) transition-colors" />
                      </button>
                    </div>

                    {/* Solana */}
                    {settings.solanaSmartAccount && (
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-elevated/50 px-3 py-2.5">
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-[#9945FF] bg-[#9945FF]/10 border border-[#9945FF]/15 rounded px-2 py-0.5">
                          SOL
                        </span>
                        <code className="text-[11px] text-foreground/80 font-mono flex-1 truncate">
                          {settings.solanaSmartAccount}
                        </code>
                        <button onClick={() => copyToClipboard(settings.solanaSmartAccount)} className="shrink-0 p-1.5 rounded-md hover:bg-white/5 transition-colors group/cp">
                          <Copy size={12} className="text-(--text-muted) group-hover/cp:text-(--green) transition-colors" />
                        </button>
                      </div>
                    )}

                    <p className="text-[10px] text-(--text-muted) leading-relaxed pt-1">
                      Deposit funds to these addresses. Your agent operates through them across all 21 chains.
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleInit}
                  disabled={initializing}
                  className="flex items-center gap-2 rounded border border-border px-4 py-2 text-[10px] uppercase tracking-widest text-(--text-secondary) hover:border-(--green) hover:text-(--green) transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={12} className={initializing ? "animate-spin" : ""} />
                  {initializing ? "Initializing..." : "Initialize Universal Account"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="rounded border border-(--red)/20 bg-(--red)/5 p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-(--red)">
            Danger Zone
          </h2>
          <p className="text-[10px] text-(--text-secondary)">
            Clear all saved settings and transaction logs from this browser.
          </p>
          <button
            onClick={() => {
              if (confirm("Clear all settings and transaction logs? This cannot be undone.")) {
                localStorage.removeItem("uniagent_settings");
                localStorage.removeItem("uniagent_txlog");
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 rounded border border-(--red)/30 px-4 py-2 text-[10px] uppercase tracking-widest text-(--red) hover:bg-(--red)/10 transition-all"
          >
            <Trash2 size={12} />
            Clear All Data
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 rounded px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
            saved
              ? "bg-(--green)/20 text-(--green)"
              : "bg-(--green) text-black hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          }`}
        >
          {saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? "Saved!" : "Save Configuration"}
        </button>
      </motion.div>
    </div>
  );
}
