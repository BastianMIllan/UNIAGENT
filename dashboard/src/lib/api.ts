/**
 * API client — calls the UniAgent backend
 */

import { loadSettings } from "./settings";

// ── Types ──────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: number;
}

export interface ChainsResponse {
  chains: Record<string, number>;
  primaryAssets: string[];
}

export interface AssetBalance {
  symbol: string;
  name: string;
  totalAmount: number;
  totalAmountInUSD: number;
  chains: { chain: string; chainId: number; amount: number }[];
}

export interface BalanceResponse {
  ownerAddress: string;
  evmAddress: string | null;
  solanaAddress: string | null;
  totalBalanceUSD: number;
  assets: AssetBalance[];
}

export interface InitResponse {
  ownerAddress: string;
  smartAccountAddresses: { evm: string | null; solana: string | null };
  totalBalanceUSD: number;
  assets: { symbol: string; totalAmount: number; totalAmountInUSD: number }[];
  funded: boolean;
  instructions: Record<string, string>;
}

export interface TxPreview {
  steps: number;
  totalFeeUSD?: string;
  gasFeeUSD?: string;
  serviceFeeUSD?: string;
  lpFeeUSD?: string;
}

export interface TradeResponse {
  rootHash: string;
  preview: TxPreview;
  message: string;
}

export interface SubmitResponse {
  transactionId: string;
  explorerUrl: string;
  fees: { totalUSD: string; gasUSD: string } | null;
}

export interface HistoryItem {
  transactionId: string;
  status: string;
  createdAt: string;
  explorerUrl: string;
}

export interface HistoryResponse {
  page: number;
  pageSize: number;
  items: HistoryItem[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getHeaders(): HeadersInit {
  const settings = loadSettings();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (settings.apiKey) headers["x-api-key"] = settings.apiKey;
  return headers;
}

function baseUrl(): string {
  return loadSettings().backendUrl || "http://localhost:3069";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const res = await fetch(url, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const api = {
  health: () => request<HealthResponse>("GET", "/health"),

  chains: () => request<ChainsResponse>("GET", "/chains"),

  init: (ownerAddress: string) =>
    request<InitResponse>("POST", "/init", { ownerAddress }),

  balance: (ownerAddress: string) =>
    request<BalanceResponse>("POST", "/balance", { ownerAddress }),

  buy: (params: { ownerAddress: string; chain: string; token: string; amountInUSD: number; slippageBps?: number }) =>
    request<TradeResponse>("POST", "/buy", params),

  sell: (params: { ownerAddress: string; chain: string; token: string; amount: number; slippageBps?: number }) =>
    request<TradeResponse>("POST", "/sell", params),

  convert: (params: { ownerAddress: string; chain: string; asset: string; amount: number; slippageBps?: number }) =>
    request<TradeResponse>("POST", "/convert", params),

  transfer: (params: { ownerAddress: string; chain: string; token: string; amount: number; receiver: string; slippageBps?: number }) =>
    request<TradeResponse>("POST", "/transfer", params),

  submit: (rootHash: string, signature: string) =>
    request<SubmitResponse>("POST", "/submit", { rootHash, signature }),

  history: (ownerAddress: string, page = 1, pageSize = 20) =>
    request<HistoryResponse>("POST", "/history", { ownerAddress, page, pageSize }),
};
