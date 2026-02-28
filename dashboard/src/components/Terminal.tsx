"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Terminal as TermIcon } from "lucide-react";
import { api } from "@/lib/api";
import { loadSettings } from "@/lib/settings";
import { addTxLogEntry, updateTxLogEntry } from "@/lib/txlog";
import { useAccount, useSignMessage } from "wagmi";

interface Message {
  role: "user" | "agent" | "system";
  text: string;
  ts: number;
}

const HELP_TEXT = `Available commands:
  balance              — Show wallet balance
  buy <$amt> <token> on <chain>  — Buy token
  sell <amt> <token> on <chain>  — Sell token
  convert <amt> <asset> on <chain>  — Convert asset
  transfer <amt> <token> to <addr> on <chain>  — Transfer
  confirm <rootHash>   — Sign & submit pending tx
  history              — Transaction history
  chains               — List supported chains
  status               — Backend health check
  help                 — Show this message`;

export default function TerminalChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", text: "[UNIAGENT v1.0.0] Terminal ready. Type 'help' for commands.", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const addMsg = (role: Message["role"], text: string) => {
    setMessages((prev) => [...prev, { role, text, ts: Date.now() }]);
  };

  const handleSend = async () => {
    if (!input.trim() || processing) return;
    const cmd = input.trim();
    setInput("");
    addMsg("user", cmd);
    setProcessing(true);

    try {
      await executeCommand(cmd);
    } catch (err) {
      addMsg("system", `Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setProcessing(false);
    }
  };

  const getOwner = () => {
    const s = loadSettings();
    if (!s.ownerAddress) throw new Error("No owner address configured. Go to Settings first.");
    return s.ownerAddress;
  };

  const executeCommand = async (raw: string) => {
    const lower = raw.toLowerCase().trim();
    const parts = lower.split(/\s+/);

    // help
    if (parts[0] === "help") {
      addMsg("agent", HELP_TEXT);
      return;
    }

    // status
    if (parts[0] === "status") {
      const h = await api.health();
      addMsg("agent", `Backend: ${h.status}\nService: ${h.service}\nTimestamp: ${new Date(h.timestamp).toISOString()}`);
      return;
    }

    // chains
    if (parts[0] === "chains") {
      const c = await api.chains();
      const names = Object.keys(c.chains).join(", ");
      addMsg("agent", `Supported chains: ${names}\nPrimary assets: ${c.primaryAssets.join(", ")}`);
      return;
    }

    // balance
    if (parts[0] === "balance") {
      const owner = getOwner();
      addMsg("system", "Fetching balance...");
      const b = await api.balance(owner);
      const lines = [
        `Total: $${Number(b.totalBalanceUSD).toFixed(2)}`,
        `EVM Account: ${b.evmAddress || "N/A"}`,
        `Solana Account: ${b.solanaAddress || "N/A"}`,
        "",
        ...b.assets.map((a) =>
          `  ${a.symbol.padEnd(6)} ${String(a.totalAmount).padEnd(16)} $${Number(a.totalAmountInUSD).toFixed(2)}`
        ),
      ];
      if (b.assets.length === 0) lines.push("  (no assets — deposit funds to your smart account)");
      addMsg("agent", lines.join("\n"));
      return;
    }

    // history
    if (parts[0] === "history") {
      const owner = getOwner();
      addMsg("system", "Fetching history...");
      const h = await api.history(owner);
      if (h.items.length === 0) {
        addMsg("agent", "No transactions found.");
      } else {
        const lines = h.items.map((tx) =>
          `  ${tx.transactionId.slice(0, 12)}... | ${tx.status} | ${tx.createdAt || "—"}`
        );
        addMsg("agent", `Recent transactions:\n${lines.join("\n")}`);
      }
      return;
    }

    // buy $500 ETH on arbitrum
    if (parts[0] === "buy") {
      const match = raw.match(/buy\s+\$?([\d.]+)\s+(\w+)\s+on\s+(\w+)/i);
      if (!match) {
        addMsg("system", "Usage: buy <$amount> <token> on <chain>\nExample: buy $500 ETH on arbitrum");
        return;
      }
      const [, amtStr, token, chain] = match;
      const owner = getOwner();
      addMsg("system", `Creating BUY: $${amtStr} of ${token.toUpperCase()} on ${chain}...`);
      const result = await api.buy({ ownerAddress: owner, chain, token: token.toLowerCase() === "native" ? "native" : token.toUpperCase(), amountInUSD: parseFloat(amtStr) });
      addTxLogEntry({
        rootHash: result.rootHash,
        type: "BUY",
        asset: token.toUpperCase(),
        chain,
        amount: `$${amtStr}`,
        createdAt: Date.now(),
        status: "pending",
        preview: result.preview,
      });
      addMsg("agent", formatTradeResult("BUY", result));
      return;
    }

    // sell 1.5 ETH on arbitrum
    if (parts[0] === "sell") {
      const match = raw.match(/sell\s+([\d.]+)\s+(\w+)\s+on\s+(\w+)/i);
      if (!match) {
        addMsg("system", "Usage: sell <amount> <token> on <chain>\nExample: sell 1.5 ETH on arbitrum");
        return;
      }
      const [, amtStr, token, chain] = match;
      const owner = getOwner();
      addMsg("system", `Creating SELL: ${amtStr} ${token.toUpperCase()} on ${chain}...`);
      const result = await api.sell({ ownerAddress: owner, chain, token: token.toUpperCase(), amount: parseFloat(amtStr) });
      addTxLogEntry({
        rootHash: result.rootHash,
        type: "SELL",
        asset: token.toUpperCase(),
        chain,
        amount: `${amtStr} ${token.toUpperCase()}`,
        createdAt: Date.now(),
        status: "pending",
        preview: result.preview,
      });
      addMsg("agent", formatTradeResult("SELL", result));
      return;
    }

    // convert 100 USDC on arbitrum
    if (parts[0] === "convert") {
      const match = raw.match(/convert\s+([\d.]+)\s+(\w+)\s+on\s+(\w+)/i);
      if (!match) {
        addMsg("system", "Usage: convert <amount> <asset> on <chain>\nExample: convert 100 USDC on arbitrum");
        return;
      }
      const [, amtStr, asset, chain] = match;
      const owner = getOwner();
      addMsg("system", `Creating CONVERT: ${amtStr} ${asset.toUpperCase()} on ${chain}...`);
      const result = await api.convert({ ownerAddress: owner, chain, asset: asset.toUpperCase(), amount: parseFloat(amtStr) });
      addTxLogEntry({
        rootHash: result.rootHash,
        type: "CONVERT",
        asset: asset.toUpperCase(),
        chain,
        amount: `${amtStr} ${asset.toUpperCase()}`,
        createdAt: Date.now(),
        status: "pending",
        preview: result.preview,
      });
      addMsg("agent", formatTradeResult("CONVERT", result));
      return;
    }

    // transfer 0.5 ETH to 0x... on arbitrum
    if (parts[0] === "transfer") {
      const match = raw.match(/transfer\s+([\d.]+)\s+(\w+)\s+to\s+(0x[a-fA-F0-9]+)\s+on\s+(\w+)/i);
      if (!match) {
        addMsg("system", "Usage: transfer <amount> <token> to <address> on <chain>\nExample: transfer 0.5 ETH to 0x1234... on arbitrum");
        return;
      }
      const [, amtStr, token, receiver, chain] = match;
      const owner = getOwner();
      addMsg("system", `Creating TRANSFER: ${amtStr} ${token.toUpperCase()} → ${receiver.slice(0, 8)}... on ${chain}...`);
      const result = await api.transfer({ ownerAddress: owner, chain, token: token.toUpperCase(), amount: parseFloat(amtStr), receiver });
      addTxLogEntry({
        rootHash: result.rootHash,
        type: "TRANSFER",
        asset: token.toUpperCase(),
        chain,
        amount: `${amtStr} ${token.toUpperCase()}`,
        createdAt: Date.now(),
        status: "pending",
        preview: result.preview,
      });
      addMsg("agent", formatTradeResult("TRANSFER", result));
      return;
    }

    // confirm <rootHash>
    if (parts[0] === "confirm") {
      const rootHash = parts[1];
      if (!rootHash) {
        addMsg("system", "Usage: confirm <rootHash>");
        return;
      }
      if (!isConnected) {
        addMsg("system", "No wallet connected. Connect your wallet first.");
        return;
      }
      addMsg("system", "Requesting wallet signature...");
      try {
        const signature = await signMessageAsync({ message: rootHash });
        addMsg("system", "Submitting signed transaction...");
        const result = await api.submit(rootHash, signature);
        updateTxLogEntry(rootHash, {
          transactionId: result.transactionId,
          status: "confirmed",
          explorerUrl: result.explorerUrl,
        });
        addMsg("agent", [
          `✓ Transaction submitted!`,
          `├─ ID: ${result.transactionId}`,
          `├─ Explorer: ${result.explorerUrl}`,
          result.fees ? `└─ Fees: $${result.fees.totalUSD} (gas: $${result.fees.gasUSD})` : `└─ Fees: N/A`,
        ].join("\n"));
      } catch (err) {
        updateTxLogEntry(rootHash, { status: "failed" });
        throw err;
      }
      return;
    }

    addMsg("system", `Unknown command: "${parts[0]}". Type 'help' for available commands.`);
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "user": return "text-cyan";
      case "agent": return "text-(--green)";
      case "system": return "text-(--text-secondary)";
      default: return "";
    }
  };

  const rolePrefix = (role: string) => {
    switch (role) {
      case "user": return "you@uniagent ~$";
      case "agent": return "agent@uniagent ~#";
      case "system": return "[SYS]";
      default: return "";
    }
  };

  return (
    <div className="flex h-full flex-col rounded border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 bg-elevated">
        <TermIcon size={14} className="text-(--green)" />
        <span className="text-xs tracking-widest uppercase text-(--text-secondary)">
          Agent Terminal
        </span>
        {processing && (
          <span className="ml-2 text-[10px] text-(--yellow) animate-pulse">Processing...</span>
        )}
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-(--red) opacity-60" />
          <div className="w-2.5 h-2.5 rounded-full bg-(--yellow) opacity-60" />
          <div className="w-2.5 h-2.5 rounded-full bg-(--green) opacity-60" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="font-mono"
            >
              <span className={`${roleColor(msg.role)} mr-2 text-xs`}>
                {rolePrefix(msg.role)}
              </span>
              <span className="text-foreground whitespace-pre-wrap">
                {msg.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t border-border p-3 flex items-center gap-2 bg-elevated">
        <span className="text-cyan text-xs">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={processing ? "Processing..." : "buy $500 ETH on arbitrum..."}
          disabled={processing}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-(--text-muted) disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={processing}
          className="p-1.5 rounded hover:bg-(--green-glow) transition-colors disabled:opacity-50"
        >
          <Send size={14} className="text-(--green)" />
        </button>
      </div>
    </div>
  );
}

function formatTradeResult(type: string, result: { rootHash: string; preview: { steps: number; totalFeeUSD?: string; gasFeeUSD?: string }; message: string }) {
  return [
    `${type} transaction created!`,
    `├─ Root Hash: ${result.rootHash}`,
    `├─ Steps: ${result.preview.steps}`,
    result.preview.totalFeeUSD ? `├─ Est. Fee: $${result.preview.totalFeeUSD}` : null,
    result.preview.gasFeeUSD ? `├─ Gas: $${result.preview.gasFeeUSD}` : null,
    `└─ To submit: confirm ${result.rootHash}`,
    "",
    `⚠ Review the preview above, then type:`,
    `  confirm ${result.rootHash}`,
  ].filter(Boolean).join("\n");
}
