// providers/AppProviders.jsx
"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./AuthProvider";

// ===== env =====
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;

// Debug logging
if (typeof window !== "undefined") {
  console.log("🔧 Environment check:");
  console.log("- WalletConnect Project ID:", projectId ? "✅ Set" : "❌ Missing");
  console.log("- Environment:", process.env.NODE_ENV);
}

// ===== WAGMI COMENT - FUNCTIONS NO USED =====
// Keep a reference to Web3Modal - but don't use it if LiFi is handling wallets
// let web3Modal = null;
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

  // ===== ONLY QUERY CLIENT PROVIDER - NO WAGMI =====
  useEffect(() => {
    console.log("✅ AppProviders initialized - LiFi handles ALL wallet connections");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
