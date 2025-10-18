// providers/AppProviders.jsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { WagmiProvider, createConfig, http } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import { mainnet, base, arbitrum, optimism } from "wagmi/chains";

import { RelayKitProvider } from "@relayprotocol/relay-kit-ui";
import { MAINNET_RELAY_API, convertViemChainToRelayChain } from "@relayprotocol/relay-sdk";
import { useRelayChains } from "@relayprotocol/relay-kit-hooks";

import { createWeb3Modal } from "@web3modal/wagmi/react";

// ===== env =====
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;

// keep a reference to Web3Modal
let web3Modal = null;
export const openConnectModal = () => {
  if (web3Modal) {
    web3Modal.open();
  } else {
    console.warn("⚠️ Web3Modal is not ready. Please check your WalletConnect Project ID configuration.");
    // Optionally show a user-friendly message
    alert("Wallet connection is not available. Please check the console for configuration details.");
  }
};

// ---------- external: Only QueryClient ----------
export default function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (n, err) => (err?.response?.status === 400 ? false : n < 3),
            staleTime: 5 * 60 * 1000,
            cacheTime: 10 * 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersWithChains>{children}</ProvidersWithChains>
    </QueryClientProvider>
  );
}

// ---------- Internal: useRelayChains ok ----------
function ProvidersWithChains({ children }) {
  // bring in chains from Relay
  const { viemChains, relayChains } = useRelayChains(MAINNET_RELAY_API);

  // Fallback while loading chains from Relay
  const evmChains = viemChains?.length ? viemChains : [mainnet, base, arbitrum, optimism];
  const relayChainsSafe =
    relayChains?.length
      ? relayChains
      : [mainnet, base, arbitrum, optimism].map(convertViemChainToRelayChain);

  // Config of wagmi
  const wagmiConfig = useMemo(() => {
    return createConfig({
      chains: evmChains,
      connectors: projectId && projectId !== "your_walletconnect_project_id_here" ? [
        walletConnect({
          projectId,
          showQrModal: false, 
          metadata: {
            name: "OakSoft DeFi",
            description: "Decentralized Finance Platform",
            url: "https://localhost:3000",
            icons: [],
          },
        }),
      ] : [],
      transports: Object.fromEntries(evmChains.map((c) => [c.id, http()])),
    });
  }, [evmChains]);

  // initialize Web3Modal if we have wagmi + chains
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!projectId) {
      console.warn("⚠️ WalletConnect Project ID is missing. Please set NEXT_PUBLIC_WALLETCONNECT_ID in .ENV");
      return;
    }
    if (projectId === "dummy_project_id" || projectId === "your_walletconnect_project_id_here") {
      console.warn("⚠️ Please replace the dummy WalletConnect Project ID with a real one from https://cloud.walletconnect.com");
      return;
    }
    if (web3Modal) return;

    try {
      web3Modal = createWeb3Modal({
        wagmiConfig,
        projectId,
        chains: evmChains,
        themeMode: "dark",
        enableAnalytics: false,
        enableOnramp: false,
        metadata: {
          name: "OakSoft DeFi",
          description: "Decentralized Finance Platform",
          url: "https://localhost:3000",
          icons: [],
        },
      });
      console.log("✅ Web3Modal initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Web3Modal:", error);
    }
  }, [evmChains, wagmiConfig]);

  // Recommended: Relay → Wagmi → children
  return (
    <RelayKitProvider
      options={{
        appName: "OakSoft DeFi",
        chains: relayChainsSafe, // All chains supported by Relay
        baseApiUrl: MAINNET_RELAY_API,
        themeScheme: "dark",
      }}
    >
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        {children}
      </WagmiProvider>
    </RelayKitProvider>
  );
}
