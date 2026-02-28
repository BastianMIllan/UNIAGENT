"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, type BalanceResponse, type HistoryResponse, type ChainsResponse, type HealthResponse } from "@/lib/api";
import { useAccount } from "wagmi";

// ── Generic fetch hook ─────────────────────────────────────────────────────

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = [], interval = 0): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const doFetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    doFetch();
    if (interval > 0) {
      intervalRef.current = setInterval(doFetch, interval);
    }
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [doFetch, interval]);

  return { data, loading, error, refetch: doFetch };
}

// ── Specific hooks ─────────────────────────────────────────────────────────

export function useBalance(): UseFetchResult<BalanceResponse> {
  const { address, isConnected } = useAccount();
  const addr = isConnected ? address : undefined;
  return useFetch(
    () => {
      if (!addr) throw new Error("Connect your wallet to view balance.");
      return api.balance(addr);
    },
    [addr],
    30_000 // refresh every 30s
  );
}

export function useHistory(page = 1, pageSize = 20): UseFetchResult<HistoryResponse> {
  const { address, isConnected } = useAccount();
  const addr = isConnected ? address : undefined;
  return useFetch(
    () => {
      if (!addr) throw new Error("Connect your wallet.");
      return api.history(addr, page, pageSize);
    },
    [addr, page, pageSize],
    30_000
  );
}

export function useChains(): UseFetchResult<ChainsResponse> {
  return useFetch(() => api.chains(), [], 60_000);
}

export function useHealth(): UseFetchResult<HealthResponse> {
  return useFetch(() => api.health(), [], 15_000);
}
