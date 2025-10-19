// providers/AppProviders.jsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { WagmiProvider, createConfig, http } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import { mainnet, base, arbitrum, optimism } from "wagmi/chains";

import { createWeb3Modal } from "@web3modal/wagmi/react";

// ===== env =====
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;

// Debug logging
if (typeof window !== "undefined") {
  console.log("🔧 Environment check:");
  console.log("- WalletConnect Project ID:", projectId ? "✅ Set" : "❌ Missing");
  console.log("- Environment:", process.env.NODE_ENV);
}

// Keep a reference to Web3Modal - but don't use it if LiFi is handling wallets
let web3Modal = null;
export const openConnectModal = () => {
  console.log("⚠️ Using LiFi widget's internal wallet connection instead");
};

// ---------- external: Only QueryClient ----------
export default function AppProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (error?.response?.status === 400) return false;
              if (error?.response?.status === 401 || error?.response?.status === 403) return false;
              return failureCount < 3;
            },
            staleTime: 5 * 60 * 1000,
            cacheTime: 10 * 60 * 1000,
            onError: (error) => {
              console.error("🚨 Query error:", {
                message: error?.message,
                status: error?.response?.status,
                url: error?.config?.url,
              });
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProvidersWithWagmi>{children}</ProvidersWithWagmi>
    </QueryClientProvider>
  );
}

// ---------- Wagmi only (Relay removed) ----------
function ProvidersWithWagmi({ children }) {

  const evmChains = [mainnet, base, arbitrum, optimism];

  // Wagmi config with basic connectors for LiFi compatibility
  const wagmiConfig = useMemo(() => {
    const connectors = [];
    
    // Add WalletConnect only if we have project ID
    if (projectId && projectId !== "your_walletconnect_project_id_here") {
      connectors.push(
        walletConnect({
          projectId,
          showQrModal: false, // Let LiFi handle the UI
          metadata: {
            name: "OakSoft DeFi",
            description: "Decentralized Finance Platform",
            url: typeof window !== "undefined" ? window.location.origin : "https://localhost:3000",
            icons: [],
          },
        })
      );
    }

    return createConfig({
      chains: evmChains,
      connectors,
      transports: Object.fromEntries(evmChains.map((c) => [c.id, http()])),
      ssr: true,
    });
  }, [projectId]);

  // Skip Web3Modal initialization - LiFi will handle wallet connections
  useEffect(() => {
    console.log("✅ AppProviders initialized - letting LiFi handle wallet connections");
  }, []);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      {children}
    </WagmiProvider>
  );
}
