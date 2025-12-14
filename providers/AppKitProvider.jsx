"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
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
  url: "https://oak-soft-ten.vercel.app/", // origin must match your domain/subdomain
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// Create the AppKit modal instance (per docs)
const modal = createAppKit({
  adapters: [wagmiAdapter],
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
