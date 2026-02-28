/**
 * Local transaction log — stores tx detail in localStorage
 * The backend's /history endpoint only returns minimal fields.
 * We store enriched details client-side when the user creates transactions.
 */

export interface TxLogEntry {
  rootHash: string;
  type: "BUY" | "SELL" | "CONVERT" | "TRANSFER";
  asset: string;
  chain: string;
  amount: string;
  createdAt: number;
  transactionId?: string;
  status: "pending" | "submitted" | "confirmed" | "failed";
  explorerUrl?: string;
  preview?: {
    steps: number;
    totalFeeUSD?: string;
  };
}

const LOG_KEY = "uniagent_txlog";
const MAX_ENTRIES = 200;

export function getTxLog(): TxLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addTxLogEntry(entry: TxLogEntry): void {
  const log = getTxLog();
  log.unshift(entry); // newest first
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export function updateTxLogEntry(rootHash: string, updates: Partial<TxLogEntry>): void {
  const log = getTxLog();
  const idx = log.findIndex((e) => e.rootHash === rootHash);
  if (idx !== -1) {
    log[idx] = { ...log[idx], ...updates };
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  }
}

export function clearTxLog(): void {
  localStorage.removeItem(LOG_KEY);
}
