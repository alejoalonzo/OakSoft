"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { BitcoinAdapter } from "@reown/appkit-adapter-bitcoin";
import { TonAdapter } from "@reown/appkit-adapter-ton";
import { cookieToInitialState, WagmiProvider } from "wagmi";

import { wagmiAdapter, projectId, networks } from "@/lib/appkitConfig";
import { AuthProvider } from "./AuthProvider";

// Single QueryClient instance for the whole app
const queryClient = new QueryClient();

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// App metadata (adjust to your app)
const metadata = {
  name: "oak",
  description: "Deccentralized Asset Management",
  url: "https://oak-soft-ten.vercel.app/", 
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// Non-EVM adapters (multichain)
const solanaAdapter = new SolanaAdapter();
const bitcoinAdapter = new BitcoinAdapter({ projectId });
const tonAdapter = new TonAdapter({ projectId });

// Create the AppKit modal instance (per docs)
const modal = createAppKit({
  adapters: [wagmiAdapter, solanaAdapter, bitcoinAdapter, tonAdapter],
  projectId,
  networks,
  defaultNetwork: networks[0],
  metadata,
  features: {
    analytics: true, // Optional - defaults to Cloud configuration
  },
});

export default function AppKitProvider({ children, cookies }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies || null);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
