"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { loadSettings, saveSettings, type AppSettings } from "@/lib/settings";
import { api } from "@/lib/api";

interface ConnectionStatus {
  connected: boolean;
  checking: boolean;
  lastChecked: number | null;
  error: string | null;
}

interface SettingsContextValue {
  settings: AppSettings;
  update: (partial: Partial<AppSettings>) => void;
  connection: ConnectionStatus;
  checkConnection: () => Promise<void>;
  initWallet: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [connection, setConnection] = useState<ConnectionStatus>({
    connected: false,
    checking: false,
    lastChecked: null,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  // Listen for external changes (other tabs)
  useEffect(() => {
    const handler = () => setSettings(loadSettings());
    window.addEventListener("uniagent_settings_changed", handler);
    return () => window.removeEventListener("uniagent_settings_changed", handler);
  }, []);

  const update = useCallback((partial: Partial<AppSettings>) => {
    const merged = saveSettings(partial);
    setSettings(merged);
  }, []);

  const checkConnection = useCallback(async () => {
    setConnection((prev) => ({ ...prev, checking: true }));
    try {
      await api.health();
      setConnection({ connected: true, checking: false, lastChecked: Date.now(), error: null });
    } catch (err) {
      setConnection({
        connected: false,
        checking: false,
        lastChecked: Date.now(),
        error: err instanceof Error ? err.message : "Connection failed",
      });
    }
  }, []);

  const initWallet = useCallback(async () => {
    if (!settings.ownerAddress) return;
    try {
      const data = await api.init(settings.ownerAddress);
      update({
        evmSmartAccount: data.smartAccountAddresses.evm || "",
        solanaSmartAccount: data.smartAccountAddresses.solana || "",
      });
    } catch (err) {
      console.error("Init wallet error:", err);
    }
  }, [settings.ownerAddress, update]);

  // Health check on mount + every 30s
  useEffect(() => {
    checkConnection();
    intervalRef.current = setInterval(checkConnection, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkConnection]);

  return (
    <SettingsContext.Provider value={{ settings, update, connection, checkConnection, initWallet }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
