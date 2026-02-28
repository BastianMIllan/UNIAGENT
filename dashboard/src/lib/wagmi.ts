import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  mainnet,
  arbitrum,
  optimism,
  base,
  polygon,
  bsc,
  avalanche,
  scroll,
  zkSync,
  linea,
  mantle,
  blast,
  mode,
  gnosis,
  celo,
  moonbeam,
  fantom,
} from "wagmi/chains";

/**
 * Wagmi + RainbowKit configuration.
 *
 * WalletConnect requires a project ID.
 * Get one free at https://cloud.walletconnect.com
 * Set NEXT_PUBLIC_WC_PROJECT_ID in your .env.local
 */
export const config = getDefaultConfig({
  appName: "UniAgent",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "UNIAGENT_DEV",
  chains: [
    mainnet,
    arbitrum,
    optimism,
    base,
    polygon,
    bsc,
    avalanche,
    scroll,
    zkSync,
    linea,
    mantle,
    blast,
    mode,
    gnosis,
    celo,
    moonbeam,
    fantom,
  ],
  ssr: true,
});
