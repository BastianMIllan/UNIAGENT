/**
 * Universal Swap CLI — Calls the UniAgent backend API
 *
 * The user's wallet key stays local. Particle credentials live on the backend.
 *
 * Flow:
 *   1. CLI calls backend to create transaction → gets rootHash
 *   2. CLI signs rootHash locally with user's wallet key
 *   3. CLI sends signature to backend → backend broadcasts via Particle
 *   4. CLI shows result
 */

import { Wallet, getBytes } from "ethers";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ─── Resolve paths + load .env ───────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = join(__dirname, ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (val && !process.env[key]) process.env[key] = val;
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────

const API_URL = process.env.UNIAGENT_API_URL || "http://localhost:3069";
const API_KEY = process.env.UNIAGENT_API_KEY || "";
const PRIVATE_KEY = process.env.UA_PRIVATE_KEY || "";

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function api(path, body = null) {
  const headers = { "Content-Type": "application/json" };
  if (API_KEY) headers["x-api-key"] = API_KEY;

  const opts = { headers };
  if (body) {
    opts.method = "POST";
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error ${res.status}`);
  }
  return data;
}

// ─── Wallet ──────────────────────────────────────────────────────────────────

function getWallet() {
  if (!PRIVATE_KEY) {
    throw new Error(
      "Missing UA_PRIVATE_KEY. Set it in .env or as an environment variable.\n" +
      "This is YOUR wallet's private key — it never leaves your machine."
    );
  }
  return new Wallet(PRIVATE_KEY);
}

// ─── Arg parser ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      positional.push(a);
    }
  }
  return { command: positional[0], args };
}

// ─── Sign + Submit flow ──────────────────────────────────────────────────────

async function signAndSubmit(rootHash) {
  const wallet = getWallet();
  console.log("  Signing locally with your wallet...");
  const signature = wallet.signMessageSync(getBytes(rootHash));

  console.log("  Submitting signed transaction...\n");
  const result = await api("/submit", { rootHash, signature });

  console.log("╔══════════════════════════════════════════╗");
  console.log("║        TRANSACTION SUCCESSFUL            ║");
  console.log("╚══════════════════════════════════════════╝\n");
  console.log(`  Transaction ID: ${result.transactionId}`);
  console.log(`  Explorer:       ${result.explorerUrl}`);
  if (result.fees) {
    console.log(`  Total Fee:      $${result.fees.totalUSD}`);
  }
  console.log("");
}

// ─── Print preview ───────────────────────────────────────────────────────────

function printPreview(data) {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║        TRANSACTION PREVIEW               ║");
  console.log("╚══════════════════════════════════════════╝\n");

  if (data.preview) {
    const p = data.preview;
    if (p.totalFeeUSD) console.log(`  Total Fee:     $${p.totalFeeUSD}`);
    if (p.gasFeeUSD) console.log(`  Gas Fee:       $${p.gasFeeUSD}`);
    if (p.serviceFeeUSD) console.log(`  Service Fee:   $${p.serviceFeeUSD}`);
    if (p.lpFeeUSD) console.log(`  LP Fee:        $${p.lpFeeUSD}`);
    if (p.steps) console.log(`  Steps:         ${p.steps} operation(s)`);
  }

  console.log(`  Root Hash:     ${data.rootHash}`);
  console.log("");
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

async function cmdBalance() {
  const wallet = getWallet();
  console.log("\nFetching balance...\n");

  const data = await api("/balance", { ownerAddress: wallet.address });

  console.log("╔══════════════════════════════════════════╗");
  console.log("║        UNIVERSAL ACCOUNT                 ║");
  console.log("╚══════════════════════════════════════════╝\n");
  console.log(`  Owner (EOA):    ${data.ownerAddress}`);
  console.log(`  EVM Address:    ${data.evmAddress || "N/A"}`);
  console.log(`  Solana Address: ${data.solanaAddress || "N/A"}`);
  console.log(`\n  Unified Balance: $${data.totalBalanceUSD?.toFixed(4) || "0.0000"}`);

  if (data.assets && data.assets.length > 0) {
    console.log("\n  ── Assets ──");
    for (const a of data.assets) {
      console.log(`    ${a.symbol.padEnd(8)} ${String(a.totalAmount).padStart(14)} ($${a.totalAmountInUSD?.toFixed(2) || "0.00"})`);
      for (const c of a.chains) {
        console.log(`      └─ ${c.chain.padEnd(14)} ${c.amount}`);
      }
    }
  }
  console.log("");
}

async function cmdBuy(args) {
  const wallet = getWallet();
  const preview = !!args.preview;

  console.log(`\nCreating buy order...`);
  console.log(`  Chain: ${args.chain}`);
  console.log(`  Token: ${args.token}`);
  console.log(`  Amount: $${args.amount} USD\n`);

  const data = await api("/buy", {
    ownerAddress: wallet.address,
    chain: args.chain,
    token: args.token,
    amountInUSD: args.amount,
  });

  printPreview(data);

  if (preview) {
    console.log("  [PREVIEW] Transaction NOT executed.\n");
    return;
  }

  await signAndSubmit(data.rootHash);
}

async function cmdSell(args) {
  const wallet = getWallet();
  const preview = !!args.preview;

  console.log(`\nCreating sell order...`);
  console.log(`  Chain: ${args.chain}`);
  console.log(`  Token: ${args.token}`);
  console.log(`  Amount: ${args.amount} tokens\n`);

  const data = await api("/sell", {
    ownerAddress: wallet.address,
    chain: args.chain,
    token: args.token,
    amount: args.amount,
  });

  printPreview(data);

  if (preview) {
    console.log("  [PREVIEW] Transaction NOT executed.\n");
    return;
  }

  await signAndSubmit(data.rootHash);
}

async function cmdConvert(args) {
  const wallet = getWallet();
  const preview = !!args.preview;

  console.log(`\nCreating convert order...`);
  console.log(`  Chain: ${args.chain}`);
  console.log(`  Asset: ${args.asset}`);
  console.log(`  Amount: ${args.amount}\n`);

  const data = await api("/convert", {
    ownerAddress: wallet.address,
    chain: args.chain,
    asset: args.asset,
    amount: args.amount,
  });

  printPreview(data);

  if (preview) {
    console.log("  [PREVIEW] Transaction NOT executed.\n");
    return;
  }

  await signAndSubmit(data.rootHash);
}

async function cmdTransfer(args) {
  const wallet = getWallet();
  const preview = !!args.preview;

  console.log(`\nCreating transfer...`);
  console.log(`  Chain: ${args.chain}`);
  console.log(`  Token: ${args.token}`);
  console.log(`  Amount: ${args.amount}`);
  console.log(`  To: ${args.to}\n`);

  const data = await api("/transfer", {
    ownerAddress: wallet.address,
    chain: args.chain,
    token: args.token,
    amount: args.amount,
    receiver: args.to,
  });

  printPreview(data);

  if (preview) {
    console.log("  [PREVIEW] Transaction NOT executed.\n");
    return;
  }

  await signAndSubmit(data.rootHash);
}

async function cmdHistory(args) {
  const wallet = getWallet();
  const page = parseInt(args.page || "1", 10);
  const size = parseInt(args.size || "10", 10);

  console.log(`\nFetching history (page ${page})...\n`);

  const data = await api("/history", {
    ownerAddress: wallet.address,
    page,
    pageSize: size,
  });

  console.log("╔══════════════════════════════════════════╗");
  console.log("║        TRANSACTION HISTORY               ║");
  console.log("╚══════════════════════════════════════════╝\n");

  if (!data.items || data.items.length === 0) {
    console.log("  No transactions found.\n");
    return;
  }

  for (const tx of data.items) {
    console.log(`  [${(tx.status || "?").toUpperCase().padEnd(10)}] ${tx.transactionId}`);
    console.log(`    Time:     ${tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "?"}`);
    console.log(`    Explorer: ${tx.explorerUrl}`);
    console.log("");
  }
}

async function cmdChains() {
  const data = await api("/chains");
  console.log("\nSupported Chains:");
  const seen = new Set();
  for (const [name, id] of Object.entries(data.chains)) {
    if (seen.has(id)) continue;
    seen.add(id);
    console.log(`  ${name.padEnd(14)} (Chain ID: ${id})`);
  }
  console.log(`\nPrimary Assets: ${data.primaryAssets.join(", ")}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const { command, args } = parseArgs(process.argv.slice(2));

  try {
    switch (command) {
      case "balance":  await cmdBalance(); break;
      case "buy":      await cmdBuy(args); break;
      case "sell":     await cmdSell(args); break;
      case "convert":  await cmdConvert(args); break;
      case "transfer": await cmdTransfer(args); break;
      case "history":  await cmdHistory(args); break;
      case "chains":   await cmdChains(); break;
      default:
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║   Universal Swap — Cross-Chain Token Trading                ║
╚══════════════════════════════════════════════════════════════╝

Commands:
  balance                                    Show addresses + unified balance
  buy    --chain X --token Y --amount Z      Buy Z USD worth of token Y on chain X
  sell   --chain X --token Y --amount Z      Sell Z tokens on chain X
  convert --chain X --asset A --amount Z     Convert primary assets
  transfer --chain X --token Y --amount Z --to ADDR   Send tokens
  history [--page N --size M]                Transaction history
  chains                                     List supported chains

Flags:
  --preview    See fees without executing

Examples:
  node cli.mjs balance
  node cli.mjs buy --chain arbitrum --token 0x912...548 --amount 5
  node cli.mjs buy --chain solana --token native --amount 1
  node cli.mjs sell --chain base --token 0xabc...def --amount 100
  node cli.mjs convert --chain base --asset ETH --amount 0.01
  node cli.mjs transfer --chain arbitrum --token 0xFd0...bb9 --amount 5 --to 0x123...abc
`);
    }
  } catch (err) {
    console.error(`\n  ERROR: ${err.message}\n`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
