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

// Keep a reference to Web3Modal
let web3Modal = null;
export const openConnectModal = () => {
  if (web3Modal) {
    web3Modal.open();
  } else {
    console.warn("⚠️ Web3Modal is not ready. Configure NEXT_PUBLIC_WALLETCONNECT_ID");
    alert("Wallet connection is not available. Check console for details.");
  }
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
  // Define the EVM chains you want to support in your dApp and in the LI.FI widget
  // Tip: keep Wagmi chains in sync with the widget (allow/deny) for smooth chain switching
  const evmChains = [mainnet, base, arbitrum, optimism];

  // Wagmi config
  const wagmiConfig = useMemo(() => {
    return createConfig({
      chains: evmChains,
      connectors:
        projectId && projectId !== "your_walletconnect_project_id_here"
          ? [
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
            ]
          : [],
      transports: Object.fromEntries(evmChains.map((c) => [c.id, http()])),
      ssr: true,
    });
  }, [projectId]);

  // Init Web3Modal
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!projectId) {
      console.warn("⚠️ Set NEXT_PUBLIC_WALLETCONNECT_ID in .env.local");
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
      console.log("✅ Web3Modal initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Web3Modal:", error);
    }
  }, [wagmiConfig]);

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      {children}
    </WagmiProvider>
  );
}
