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
import { readFileSync, existsSync, writeFileSync, appendFileSync } from "node:fs";
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
// INIT — First-time setup
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reads or creates the .env file. Returns the current key-value pairs.
 */
function readEnvFile() {
  const pairs = {};
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      pairs[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  }
  return pairs;
}

/**
 * Writes a key=value to .env file. Updates existing key or appends new one.
 */
function setEnvValue(key, value) {
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    const lines = content.split("\n");
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith(`${key}=`) || trimmed.startsWith(`${key} =`)) {
        lines[i] = `${key}=${value}`;
        found = true;
        break;
      }
    }
    if (found) {
      writeFileSync(envPath, lines.join("\n"), "utf-8");
    } else {
      appendFileSync(envPath, `\n${key}=${value}\n`, "utf-8");
    }
  } else {
    writeFileSync(envPath, `${key}=${value}\n`, "utf-8");
  }
  // Also update the current process
  process.env[key] = value;
}

async function cmdInit(args) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   UniAgent — First-Time Setup                                ║
╚══════════════════════════════════════════════════════════════╝
`);

  // ── Step 1: Check backend connectivity ──────────────────────────────────
  const apiUrl = args.api || API_URL;
  console.log(`  [1/4] Checking backend at ${apiUrl}...`);
  try {
    const health = await api("/health");
    if (health.status === "ok") {
      console.log(`         ✓ Backend is running\n`);
    }
  } catch (err) {
    console.error(`
  ✗ Cannot reach backend at ${apiUrl}

  Make sure the UniAgent backend is running:
    cd backend && node server.mjs

  If the backend is at a different URL, run:
    node cli.mjs init --api http://your-backend-url
`);
    process.exit(1);
  }

  // ── Step 2: Check or generate wallet ────────────────────────────────────
  console.log(`  [2/4] Checking wallet...`);
  const envVars = readEnvFile();
  let privateKey = envVars.UA_PRIVATE_KEY || process.env.UA_PRIVATE_KEY || "";
  let wallet;
  let isNew = false;

  if (privateKey && privateKey.length > 0) {
    // Existing wallet found
    try {
      wallet = new Wallet(privateKey);
      console.log(`         ✓ Existing wallet found`);
      console.log(`         Address: ${wallet.address}\n`);
    } catch (err) {
      console.error(`  ✗ Invalid private key in .env. Fix UA_PRIVATE_KEY or delete it to generate a new one.\n`);
      process.exit(1);
    }
  } else {
    // Generate a new wallet
    wallet = Wallet.createRandom();
    privateKey = wallet.privateKey;
    isNew = true;

    console.log(`         ✓ New wallet generated`);
    console.log(`         Address: ${wallet.address}`);
    console.log(`\n  ┌────────────────────────────────────────────────────────┐`);
    console.log(`  │  ⚠  SAVE YOUR PRIVATE KEY — this is the ONLY time    │`);
    console.log(`  │     it is displayed. It has been saved to .env but    │`);
    console.log(`  │     you MUST back it up securely.                     │`);
    console.log(`  │                                                       │`);
    console.log(`  │  Private Key: ${privateKey}  │`);
    console.log(`  └────────────────────────────────────────────────────────┘\n`);

    // Save to .env
    setEnvValue("UA_PRIVATE_KEY", privateKey);
    console.log(`         ✓ Private key saved to .env\n`);
  }

  // Save API URL if custom
  if (args.api && args.api !== API_URL) {
    setEnvValue("UNIAGENT_API_URL", args.api);
    console.log(`         ✓ Backend URL saved to .env: ${args.api}\n`);
  }

  // ── Step 3: Initialize Universal Account on backend ─────────────────────
  console.log(`  [3/4] Initializing Universal Account...`);
  let initData;
  try {
    initData = await api("/init", { ownerAddress: wallet.address });
  } catch (err) {
    console.error(`\n  ✗ Failed to initialize Universal Account: ${err.message}`);
    console.error(`  This might mean the backend's Particle Network credentials are incorrect.\n`);
    process.exit(1);
  }

  const evmAddr = initData.smartAccountAddresses?.evm || "Not available";
  const solAddr = initData.smartAccountAddresses?.solana || "Not available";

  console.log(`         ✓ Universal Account initialized\n`);

  // ── Step 4: Show deposit addresses + status ─────────────────────────────
  console.log(`  [4/4] Account ready!\n`);

  console.log(`╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║   YOUR UNIVERSAL ACCOUNT                                     ║`);
  console.log(`╠══════════════════════════════════════════════════════════════╣`);
  console.log(`║                                                              ║`);
  console.log(`║   Owner Wallet (EOA):                                        ║`);
  console.log(`║   ${wallet.address}                        ║`);
  console.log(`║                                                              ║`);
  console.log(`║   Deposit Addresses (send funds HERE to start trading):      ║`);
  console.log(`║                                                              ║`);
  console.log(`║   EVM (Ethereum, Arbitrum, Base, Polygon, etc.):             ║`);
  console.log(`║   ${evmAddr.padEnd(56)}║`);
  console.log(`║                                                              ║`);
  console.log(`║   Solana:                                                    ║`);
  console.log(`║   ${solAddr.padEnd(56)}║`);
  console.log(`║                                                              ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);

  if (initData.funded) {
    console.log(`\n  Balance: $${initData.totalBalanceUSD?.toFixed(4)}`);
    if (initData.assets && initData.assets.length > 0) {
      for (const a of initData.assets) {
        console.log(`    ${a.symbol}: ${a.totalAmount} ($${a.totalAmountInUSD?.toFixed(2)})`);
      }
    }
    console.log(`\n  ✓ Account is funded. You're ready to trade!\n`);
  } else {
    console.log(`
  ── Next Steps ──────────────────────────────────────────────

  1. Send USDC to your deposit address:
     • EVM chains (Arbitrum, Base, etc.) → ${evmAddr}
     • Solana → ${solAddr}

  2. Any of these assets work: USDC, USDT, ETH, SOL, BNB, BTC
     USDC is recommended — it's the most versatile.

  3. Once funded, verify with:
     node cli.mjs balance

  4. Start trading:
     node cli.mjs buy --chain arbitrum --token 0x912...548 --amount 5
     node cli.mjs buy --chain solana --token native --amount 1

  ─────────────────────────────────────────────────────────────
`);
  }

  if (isNew) {
    console.log(`  ⚠  REMINDER: Back up your private key. If you lose it, you lose access to this account.\n`);
  }
}

async function cmdStatus() {
  console.log("\nChecking setup...\n");

  // Check backend
  const apiUrl = API_URL;
  let backendOk = false;
  try {
    const health = await api("/health");
    backendOk = health.status === "ok";
  } catch (_) {}
  console.log(`  Backend (${apiUrl}):  ${backendOk ? "✓ Online" : "✗ Unreachable"}`);

  // Check wallet
  let walletOk = false;
  let walletAddr = "";
  try {
    const w = getWallet();
    walletOk = true;
    walletAddr = w.address;
  } catch (_) {}
  console.log(`  Wallet:              ${walletOk ? `✓ ${walletAddr}` : "✗ Not configured (run: node cli.mjs init)"}`);

  // Check balance
  if (backendOk && walletOk) {
    try {
      const data = await api("/init", { ownerAddress: walletAddr });
      const evm = data.smartAccountAddresses?.evm || "N/A";
      const sol = data.smartAccountAddresses?.solana || "N/A";
      console.log(`  EVM Address:         ${evm}`);
      console.log(`  Solana Address:      ${sol}`);
      console.log(`  Balance:             $${data.totalBalanceUSD?.toFixed(4) || "0.0000"}`);
      console.log(`  Funded:              ${data.funded ? "✓ Yes — ready to trade" : "✗ No — deposit USDC to start"}`);
    } catch (err) {
      console.log(`  Account Status:      ✗ Error: ${err.message}`);
    }
  }

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
      case "init":     await cmdInit(args); break;
      case "status":   await cmdStatus(); break;
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

  First-time setup:
    node cli.mjs init                        Set up wallet + Universal Account
    node cli.mjs init --api http://url       Use a custom backend URL

  Account:
    node cli.mjs status                      Check setup (backend, wallet, balance)
    node cli.mjs balance                     Show addresses + unified balance

  Trading:
    node cli.mjs buy    --chain X --token Y --amount Z      Buy Z USD of token Y on chain X
    node cli.mjs sell   --chain X --token Y --amount Z      Sell Z tokens on chain X
    node cli.mjs convert --chain X --asset A --amount Z     Convert primary assets
    node cli.mjs transfer --chain X --token Y --amount Z --to ADDR   Send tokens

  Info:
    node cli.mjs history [--page N --size M]                Transaction history
    node cli.mjs chains                                     List supported chains

  Flags:
    --preview    See fees without executing

  Quick Start:
    1. node cli.mjs init           ← generates wallet, shows deposit addresses
    2. Send USDC to your deposit address
    3. node cli.mjs balance        ← verify funds arrived
    4. node cli.mjs buy --chain arbitrum --token 0x912...548 --amount 5
`);
    }
  } catch (err) {
    console.error(`\n  ERROR: ${err.message}\n`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
