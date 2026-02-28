"use client";

import { useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { SettingsProvider, useSettings } from "@/context/SettingsContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

function WalletSync() {
  const { address, isConnected } = useAccount();
  const { settings, update, initWallet } = useSettings();
  const prevAddress = useRef(settings.ownerAddress);

  useEffect(() => {
    if (isConnected && address && address !== prevAddress.current) {
      prevAddress.current = address;
      update({ ownerAddress: address });
    }
    if (!isConnected && prevAddress.current) {
      prevAddress.current = "";
      update({ ownerAddress: "", evmSmartAccount: "", solanaSmartAccount: "" });
    }
  }, [isConnected, address, update]);

  // Auto-init when ownerAddress changes and we don't have smart accounts yet
  useEffect(() => {
    if (
      settings.ownerAddress &&
      !settings.evmSmartAccount &&
      isConnected
    ) {
      initWallet();
    }
  }, [settings.ownerAddress, settings.evmSmartAccount, isConnected, initWallet]);

  return null;
}

function TopBar() {
  const { connection } = useSettings();

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-(--bg)/80 backdrop-blur-md px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-(--green) opacity-30" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-(--text-secondary)">
          Dashboard
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] text-(--text-secondary)">
          <span className="relative flex h-1.5 w-1.5">
            {connection.connected ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--green) opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--green)" />
              </>
            ) : (
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--red)" />
            )}
          </span>
          <span className="uppercase tracking-widest">
            {connection.checking ? "Checking..." : connection.connected ? "Backend Online" : "Backend Offline"}
          </span>
        </div>
        <ConnectButton
          chainStatus="icon"
          showBalance={false}
          accountStatus="avatar"
        />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <WalletSync />
      <div className="grid-bg noise min-h-screen">
        <Sidebar />
        <main className="ml-56 min-h-screen">
          <TopBar />
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SettingsProvider>
  );
}
