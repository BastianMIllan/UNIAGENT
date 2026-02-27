/**
 * UniAgent Backend — Wraps Particle Network Universal Accounts
 *
 * This server holds all Particle Network credentials privately.
 * Users interact through the skill, which calls this API.
 *
 * Flow:
 *   1. Skill sends user's wallet address + trade params
 *   2. Backend creates the transaction via Particle SDK (using OUR credentials)
 *   3. Backend returns rootHash for user to sign locally
 *   4. Skill signs with user's key, sends signature back
 *   5. Backend submits the signed transaction
 *   6. Backend returns result
 *
 * The user never sees Particle Network. They see YOUR service.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { UniversalAccount, CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatUnits } from "ethers";

// ─── Load .env ───────────────────────────────────────────────────────────────

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
    if (val && !process.env[key]) {
      process.env[key] = val;
    }
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3069", 10);
const API_SECRET = process.env.API_SECRET || "";
const PARTICLE_PROJECT_ID = process.env.PARTICLE_PROJECT_ID;
const PARTICLE_CLIENT_KEY = process.env.PARTICLE_CLIENT_KEY;
const PARTICLE_APP_ID = process.env.PARTICLE_APP_ID;

if (!PARTICLE_PROJECT_ID || !PARTICLE_CLIENT_KEY || !PARTICLE_APP_ID) {
  console.error("ERROR: Missing Particle Network credentials in .env");
  process.exit(1);
}

// ─── Chain name → CHAIN_ID mapping ──────────────────────────────────────────

const CHAIN_MAP = {
  ethereum: CHAIN_ID.ETHEREUM_MAINNET,
  eth: CHAIN_ID.ETHEREUM_MAINNET,
  bnb: CHAIN_ID.BSC_MAINNET,
  bsc: CHAIN_ID.BSC_MAINNET,
  base: CHAIN_ID.BASE_MAINNET,
  arbitrum: CHAIN_ID.ARBITRUM_MAINNET_ONE,
  arb: CHAIN_ID.ARBITRUM_MAINNET_ONE,
  avalanche: CHAIN_ID.AVALANCHE_MAINNET,
  avax: CHAIN_ID.AVALANCHE_MAINNET,
  optimism: CHAIN_ID.OPTIMISM_MAINNET,
  op: CHAIN_ID.OPTIMISM_MAINNET,
  polygon: CHAIN_ID.POLYGON_MAINNET,
  matic: CHAIN_ID.POLYGON_MAINNET,
  solana: CHAIN_ID.SOLANA_MAINNET,
  sol: CHAIN_ID.SOLANA_MAINNET,
  linea: CHAIN_ID.LINEA_MAINNET,
  sonic: CHAIN_ID.SONIC_MAINNET,
  berachain: CHAIN_ID.BERACHAIN_MAINNET,
  bera: CHAIN_ID.BERACHAIN_MAINNET,
  mantle: CHAIN_ID.MANTLE_MAINNET,
  monad: CHAIN_ID.MONAD_MAINNET,
  merlin: CHAIN_ID.MERLIN_MAINNET,
  hyperevm: CHAIN_ID.HYPEREVM_MAINNET,
  blast: CHAIN_ID.BLAST_MAINNET,
  manta: CHAIN_ID.MANTA_MAINNET,
  mode: CHAIN_ID.MODE_MAINNET,
  plasma: CHAIN_ID.PLASMA_MAINNET,
  xlayer: CHAIN_ID.XLAYER_MAINNET,
  conflux: CHAIN_ID.CONFLUX_ESPACE_MAINNET,
};

const ASSET_MAP = {
  USDC: SUPPORTED_TOKEN_TYPE.USDC,
  USDT: SUPPORTED_TOKEN_TYPE.USDT,
  ETH: SUPPORTED_TOKEN_TYPE.ETH,
  SOL: SUPPORTED_TOKEN_TYPE.SOL,
  BNB: SUPPORTED_TOKEN_TYPE.BNB,
  BTC: SUPPORTED_TOKEN_TYPE.BTC,
};

const NATIVE_ADDRESS = "0x0000000000000000000000000000000000000000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveChain(name) {
  if (!name) throw new Error("Missing chain parameter");
  const id = CHAIN_MAP[name.toLowerCase()];
  if (id === undefined) throw new Error(`Unknown chain: ${name}`);
  return id;
}

function resolveToken(address) {
  if (!address) throw new Error("Missing token parameter");
  if (address.toLowerCase() === "native") return NATIVE_ADDRESS;
  return address;
}

/** Create a UA instance for a given user wallet address */
function createUA(ownerAddress, opts = {}) {
  const tradeConfig = {
    slippageBps: opts.slippageBps || 100,
    universalGas: opts.universalGas !== false,
  };

  if (opts.sourceTokens && opts.sourceTokens.length > 0) {
    tradeConfig.usePrimaryTokens = opts.sourceTokens
      .map((t) => ASSET_MAP[t.toUpperCase()])
      .filter(Boolean);
  }

  return new UniversalAccount({
    projectId: PARTICLE_PROJECT_ID,
    projectClientKey: PARTICLE_CLIENT_KEY,
    projectAppUuid: PARTICLE_APP_ID,
    ownerAddress,
    tradeConfig,
  });
}

// ─── In-memory transaction store (rootHash → transaction object) ────────────
// Transactions are held server-side so the user only ever sees the rootHash.
// After signing, they submit the signature and we broadcast.

const pendingTxns = new Map();
const TX_TTL_MS = 5 * 60 * 1000; // 5 minutes

function storePendingTx(rootHash, transaction, ua) {
  pendingTxns.set(rootHash, { transaction, ua, createdAt: Date.now() });
  // Cleanup old entries
  for (const [key, val] of pendingTxns) {
    if (Date.now() - val.createdAt > TX_TTL_MS) pendingTxns.delete(key);
  }
}

// ─── Express app ─────────────────────────────────────────────────────────────

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// ─── Auth middleware (optional API secret) ───────────────────────────────────

app.use((req, res, next) => {
  if (API_SECRET && API_SECRET !== "change-me-to-a-random-secret") {
    const token = req.headers["x-api-key"] || req.query.apiKey;
    if (token !== API_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }
  next();
});

// ─── Health check ────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "uniagent", timestamp: Date.now() });
});

// ─── GET /chains — list supported chains ─────────────────────────────────────

app.get("/chains", (_req, res) => {
  const chains = {};
  for (const [name, id] of Object.entries(CHAIN_MAP)) {
    chains[name] = id;
  }
  res.json({ chains, primaryAssets: Object.keys(ASSET_MAP) });
});

// ─── POST /balance — get UA addresses + unified balance ─────────────────────

app.post("/balance", async (req, res) => {
  try {
    const { ownerAddress } = req.body;
    if (!ownerAddress) return res.status(400).json({ error: "Missing ownerAddress" });

    const ua = createUA(ownerAddress);
    const [options, assets] = await Promise.all([
      ua.getSmartAccountOptions(),
      ua.getPrimaryAssets(),
    ]);

    res.json({
      ownerAddress: options.ownerAddress,
      evmAddress: options.smartAccountAddress || null,
      solanaAddress: options.solanaSmartAccountAddress || null,
      totalBalanceUSD: assets.totalAmountInUSD,
      assets: assets.assets?.map((a) => ({
        symbol: a.token?.symbol || "Unknown",
        name: a.token?.name || "Unknown",
        totalAmount: a.totalAmount,
        totalAmountInUSD: a.totalAmountInUSD,
        chains: a.chainAggregation?.map((c) => ({
          chain: c.chain?.name || `Chain ${c.chainId}`,
          chainId: c.chainId,
          amount: c.amount,
        })) || [],
      })) || [],
    });
  } catch (err) {
    console.error("Balance error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /buy — create a buy transaction ────────────────────────────────────

app.post("/buy", async (req, res) => {
  try {
    const { ownerAddress, chain, token, amountInUSD, slippageBps } = req.body;
    if (!ownerAddress) return res.status(400).json({ error: "Missing ownerAddress" });
    if (!chain) return res.status(400).json({ error: "Missing chain" });
    if (!token) return res.status(400).json({ error: "Missing token" });
    if (!amountInUSD) return res.status(400).json({ error: "Missing amountInUSD" });

    const chainId = resolveChain(chain);
    const tokenAddress = resolveToken(token);
    const ua = createUA(ownerAddress, { slippageBps });

    const transaction = await ua.createBuyTransaction({
      token: { chainId, address: tokenAddress },
      amountInUSD: String(amountInUSD),
    });

    // Store transaction server-side, return rootHash for signing
    storePendingTx(transaction.rootHash, transaction, ua);

    const preview = extractPreview(transaction);

    res.json({
      rootHash: transaction.rootHash,
      preview,
      message: "Sign the rootHash with your wallet and POST to /submit",
    });
  } catch (err) {
    console.error("Buy error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /sell — create a sell transaction ──────────────────────────────────

app.post("/sell", async (req, res) => {
  try {
    const { ownerAddress, chain, token, amount, slippageBps } = req.body;
    if (!ownerAddress) return res.status(400).json({ error: "Missing ownerAddress" });
    if (!chain) return res.status(400).json({ error: "Missing chain" });
    if (!token) return res.status(400).json({ error: "Missing token" });
    if (!amount) return res.status(400).json({ error: "Missing amount" });

    const chainId = resolveChain(chain);
    const tokenAddress = resolveToken(token);
    const ua = createUA(ownerAddress, { slippageBps });

    const transaction = await ua.createSellTransaction({
      token: { chainId, address: tokenAddress },
      amount: String(amount),
    });

    storePendingTx(transaction.rootHash, transaction, ua);

    res.json({
      rootHash: transaction.rootHash,
      preview: extractPreview(transaction),
      message: "Sign the rootHash with your wallet and POST to /submit",
    });
  } catch (err) {
    console.error("Sell error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /convert — convert between primary assets ─────────────────────────

app.post("/convert", async (req, res) => {
  try {
    const { ownerAddress, chain, asset, amount, slippageBps } = req.body;
    if (!ownerAddress) return res.status(400).json({ error: "Missing ownerAddress" });
    if (!chain) return res.status(400).json({ error: "Missing chain" });
    if (!asset) return res.status(400).json({ error: "Missing asset" });
    if (!amount) return res.status(400).json({ error: "Missing amount" });

    const assetType = ASSET_MAP[asset.toUpperCase()];
    if (!assetType) return res.status(400).json({ error: `Unknown asset: ${asset}. Use: ${Object.keys(ASSET_MAP).join(", ")}` });

    const chainId = resolveChain(chain);
    const ua = createUA(ownerAddress, { slippageBps });

    const transaction = await ua.createConvertTransaction({
      expectToken: { type: assetType, amount: String(amount) },
      chainId,
    });

    storePendingTx(transaction.rootHash, transaction, ua);

    res.json({
      rootHash: transaction.rootHash,
      preview: extractPreview(transaction),
      message: "Sign the rootHash with your wallet and POST to /submit",
    });
  } catch (err) {
    console.error("Convert error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /transfer — send tokens cross-chain ───────────────────────────────

app.post("/transfer", async (req, res) => {
  try {
    const { ownerAddress, chain, token, amount, receiver, slippageBps } = req.body;
    if (!ownerAddress) return res.status(400).json({ error: "Missing ownerAddress" });
    if (!chain) return res.status(400).json({ error: "Missing chain" });
    if (!token) return res.status(400).json({ error: "Missing token" });
    if (!amount) return res.status(400).json({ error: "Missing amount" });
    if (!receiver) return res.status(400).json({ error: "Missing receiver" });

    const chainId = resolveChain(chain);
    const tokenAddress = resolveToken(token);
    const ua = createUA(ownerAddress, { slippageBps });

    const transaction = await ua.createTransferTransaction({
      token: { chainId, address: tokenAddress },
      amount: String(amount),
      receiver,
    });

    storePendingTx(transaction.rootHash, transaction, ua);

    res.json({
      rootHash: transaction.rootHash,
      preview: extractPreview(transaction),
      message: "Sign the rootHash with your wallet and POST to /submit",
    });
  } catch (err) {
    console.error("Transfer error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /submit — submit a signed transaction ─────────────────────────────

app.post("/submit", async (req, res) => {
  try {
    const { rootHash, signature } = req.body;
    if (!rootHash) return res.status(400).json({ error: "Missing rootHash" });
    if (!signature) return res.status(400).json({ error: "Missing signature" });

    const pending = pendingTxns.get(rootHash);
    if (!pending) {
      return res.status(404).json({ error: "Transaction not found or expired. Create a new one." });
    }

    const { transaction, ua } = pending;

    const result = await ua.sendTransaction(transaction, signature);

    // Clean up
    pendingTxns.delete(rootHash);

    res.json({
      transactionId: result.transactionId,
      explorerUrl: `https://universalx.app/activity/details?id=${result.transactionId}`,
      fees: result.fees?.totals ? {
        totalUSD: formatUnits(result.fees.totals.feeTokenAmountInUSD, 18),
        gasUSD: formatUnits(result.fees.totals.gasFeeTokenAmountInUSD, 18),
      } : null,
    });
  } catch (err) {
    console.error("Submit error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /history — get transaction history ─────────────────────────────────

app.post("/history", async (req, res) => {
  try {
    const { ownerAddress, page = 1, pageSize = 10 } = req.body;
    if (!ownerAddress) return res.status(400).json({ error: "Missing ownerAddress" });

    const ua = createUA(ownerAddress);
    const transactions = await ua.getTransactions(page, pageSize);

    res.json({
      page,
      pageSize,
      items: transactions?.items?.map((tx) => ({
        transactionId: tx.transactionId || tx.id,
        status: tx.status,
        createdAt: tx.createdAt,
        explorerUrl: `https://universalx.app/activity/details?id=${tx.transactionId || tx.id}`,
      })) || [],
    });
  } catch (err) {
    console.error("History error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Preview helper ──────────────────────────────────────────────────────────

function extractPreview(transaction) {
  const preview = { steps: 0 };

  if (transaction.feeQuotes && transaction.feeQuotes.length > 0) {
    const fee = transaction.feeQuotes[0].fees?.totals;
    if (fee) {
      preview.totalFeeUSD = formatUnits(fee.feeTokenAmountInUSD, 18);
      preview.gasFeeUSD = formatUnits(fee.gasFeeTokenAmountInUSD, 18);
      preview.serviceFeeUSD = formatUnits(fee.transactionServiceFeeTokenAmountInUSD, 18);
      preview.lpFeeUSD = formatUnits(fee.transactionLPFeeTokenAmountInUSD, 18);
    }
  }

  if (transaction.userOps) {
    preview.steps = transaction.userOps.length;
  }

  return preview;
}

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   UniAgent Backend — Cross-Chain Trading API                 ║
║   Powered by Universal Accounts (credentials hidden)         ║
╚══════════════════════════════════════════════════════════════╝

  Running on:  http://localhost:${PORT}
  Health:      http://localhost:${PORT}/health
  API Secret:  ${API_SECRET && API_SECRET !== "change-me-to-a-random-secret" ? "ENABLED" : "DISABLED (set API_SECRET in .env)"}

  Endpoints:
    POST /balance    — Get UA addresses + unified balance
    POST /buy        — Create buy transaction (returns rootHash to sign)
    POST /sell       — Create sell transaction
    POST /convert    — Convert primary assets
    POST /transfer   — Transfer tokens cross-chain
    POST /submit     — Submit signed transaction
    POST /history    — Transaction history
    GET  /chains     — List supported chains
    GET  /health     — Health check
  `);
});
