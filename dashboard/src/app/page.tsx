"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Bot,
  Layers,
  ArrowUpRight,
  Github,
} from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: Globe,
    title: "21 Chains Unified",
    desc: "Ethereum, Arbitrum, Optimism, Base, Polygon, BSC, Solana, Avalanche — all accessible through a single interface.",
  },
  {
    icon: Shield,
    title: "Non-Custodial",
    desc: "Private keys never leave your device. All transactions are signed locally and submitted securely.",
  },
  {
    icon: Zap,
    title: "USDC-Native Settlement",
    desc: "Deposit USDC once. Buy, sell, convert, and transfer any asset on any supported chain without manual bridging.",
  },
  {
    icon: Bot,
    title: "Agent-First Architecture",
    desc: "Purpose-built for AI agents. Natural language commands are translated into executed cross-chain trades autonomously.",
  },
  {
    icon: Layers,
    title: "OpenClaw Compatible",
    desc: "Ships as a standard OpenClaw skill. Install once — your agent reads the spec and handles everything from init to execution.",
  },
  {
    icon: ArrowUpRight,
    title: "Real-Time Execution",
    desc: "Sub-second transaction routing with live status tracking. Every trade is confirmed on-chain before reporting back.",
  },
];

const STATS = [
  { value: "21", label: "Supported Chains" },
  { value: "6", label: "Native Assets" },
  { value: "<1s", label: "Avg. Routing Time" },
  { value: "100%", label: "Non-Custodial" },
];

const STEPS = [
  {
    num: "01",
    title: "Install the skill",
    desc: "Add the UniAgent skill to any OpenClaw-compatible agent. One command.",
    code: "npx openclaw install universal-swap",
  },
  {
    num: "02",
    title: "Agent initializes",
    desc: "The agent reads the skill spec, generates a wallet, and connects to 21 chains automatically.",
    code: "agent > init",
  },
  {
    num: "03",
    title: "Deposit & trade",
    desc: "Fund with USDC. Then just talk — buy ETH, sell SOL, bridge to Arbitrum. The agent handles it.",
    code: 'agent > buy $500 ETH on arbitrum',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-(--bg)/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-black">
              <Zap size={16} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              UniAgent
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-(--text-secondary)">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a
              href="https://github.com/BastianMIllan/UNIAGENT"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Open Dashboard
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient orb */}
        <div className="pointer-events-none absolute top-[-200px] left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-green opacity-[0.04] blur-[120px]" />

        <div className="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-bright bg-card px-4 py-1.5 text-xs text-(--text-secondary)">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green" />
              </span>
              Now supporting 21 chains
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Autonomous trading
            <br />
            <span className="gradient-text-accent">across every chain.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-(--text-secondary) max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            UniAgent deploys AI trading agents that operate across 21 blockchains.
            Deposit USDC, give natural language instructions, and let the agent
            execute — buying, selling, converting, and bridging with zero manual steps.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 rounded-lg bg-green px-6 py-3 text-sm font-semibold text-black hover:brightness-110 transition-all"
            >
              Launch Dashboard
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="https://github.com/BastianMIllan/UNIAGENT"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border-bright px-6 py-3 text-sm font-medium text-(--text-secondary) hover:text-foreground hover:border-(--text-muted) transition-all"
            >
              <Github size={16} />
              View on GitHub
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {s.value}
              </div>
              <div className="text-xs text-(--text-secondary)">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-medium uppercase tracking-widest text-green mb-3"
          >
            Features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold tracking-tight"
          >
            Everything agents need to trade
          </motion.h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="rounded-xl border border-border bg-card p-6 hover:border-border-bright transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-elevated border border-border mb-4 group-hover:border-green/20 transition-colors">
                <f.icon size={18} className="text-green" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-(--text-secondary) leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <div className="text-center mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-medium uppercase tracking-widest text-green mb-3"
            >
              How it works
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-2xl md:text-3xl font-bold tracking-tight"
            >
              Three steps to autonomous trading
            </motion.h2>
          </div>

          <div className="space-y-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex gap-6 items-start"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-green/20 bg-(--accent-glow) text-sm font-bold text-green">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-(--text-secondary) mb-3 leading-relaxed">
                    {step.desc}
                  </p>
                  <div className="rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm text-(--text-secondary)">
                    <span className="text-(--text-muted) mr-2">$</span>
                    {step.code}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORTED CHAINS ── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-medium uppercase tracking-widest text-green mb-3"
          >
            Network
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold tracking-tight mb-4"
          >
            One agent, every chain
          </motion.h2>
          <p className="text-sm text-(--text-secondary) max-w-lg mx-auto">
            Powered by Particle Network Universal Accounts, UniAgent routes
            transactions across all major L1s and L2s through a single
            USDC-denominated account.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {[
            "Ethereum", "Arbitrum", "Optimism", "Base", "Polygon", "BSC",
            "Solana", "Avalanche", "Scroll", "zkSync Era", "Linea", "Mantle",
            "Blast", "Mode", "Sei", "opBNB", "Gnosis", "Celo",
            "Moonbeam", "Aurora", "Fantom",
          ].map((chain) => (
            <span
              key={chain}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-(--text-secondary) hover:border-border-bright hover:text-foreground transition-colors"
            >
              {chain}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Start trading autonomously.
            </h2>
            <p className="text-base text-(--text-secondary) max-w-md mx-auto mb-8">
              Deploy an agent in under a minute. No configuration,
              no bridge management, no manual swaps.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-lg bg-green px-6 py-3 text-sm font-semibold text-black hover:brightness-110 transition-all"
              >
                Open Dashboard
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="https://github.com/BastianMIllan/UNIAGENT"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border-bright px-6 py-3 text-sm font-medium text-(--text-secondary) hover:text-foreground transition-all"
              >
                <Github size={16} />
                GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-(--text-secondary)">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-green text-black">
              <Zap size={12} strokeWidth={2.5} />
            </div>
            <span className="font-medium text-foreground">UniAgent</span>
            <span className="text-(--text-muted)">·</span>
            <span>MIT License</span>
          </div>
          <div className="flex gap-6 text-sm text-(--text-secondary)">
            <a
              href="https://github.com/BastianMIllan/UNIAGENT"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
