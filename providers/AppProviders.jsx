"use client";

import { RelayKitProvider } from "@relayprotocol/relay-kit-ui";
import { MAINNET_RELAY_API, convertViemChainToRelayChain } from "@relayprotocol/relay-sdk";
import { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { createWeb3Modal } from '@web3modal/wagmi/react';
 import { mainnet, base, arbitrum, optimism, polygon, bsc, avalanche, fantom, linea, zksync, scroll } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;
// Completely remove Dune references
// const duneKey = process.env.NEXT_PUBLIC_DUNE_API_KEY;

const relayChains = [
  convertViemChainToRelayChain(mainnet),
  convertViemChainToRelayChain(base),
  convertViemChainToRelayChain(arbitrum),
  convertViemChainToRelayChain(optimism),
  convertViemChainToRelayChain(polygon),
  convertViemChainToRelayChain(bsc),
  convertViemChainToRelayChain(avalanche),
  convertViemChainToRelayChain(fantom),
  convertViemChainToRelayChain(linea),
  convertViemChainToRelayChain(zksync),
  convertViemChainToRelayChain(scroll),
];

const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, optimism, polygon, bsc, avalanche, fantom, linea, zksync, scroll],
  autoConnect: false, // Prevent auto-connection
  connectors: [
    walletConnect({
      projectId: projectId || "dummy_project_id", // Fallback to prevent errors
      showQrModal: false, // Prevent auto-popup
      metadata: {
        name: "OakSoft DeFi",
        description: "Decentralized Finance Platform",
        url: "https://localhost:3000", // Update this to your domain in production
        icons: []
      }
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [fantom.id]: http(),
    [linea.id]: http(),
    [zksync.id]: http(),
    [scroll.id]: http(),
  },
});

//Modal CONECT WALLET****
// Create Web3Modal configuration - its initialized only when needed
let web3Modal;

// Function to initialize the modal only when needed
export const initWeb3Modal = () => {
  if (typeof window !== 'undefined' && projectId && !web3Modal) {
    try {
      web3Modal = createWeb3Modal({
        wagmiConfig,                               
        projectId: projectId,
        chains: [base, mainnet, arbitrum, optimism, polygon, bsc, avalanche, fantom, linea, zksync, scroll],
        themeMode: 'dark',
        enableAnalytics: false, // Disable analytics to prevent auto-opens
        enableOnramp: false, // Disable onramp features
        metadata: {
          name: "OakSoft DeFi",
          description: "Decentralized Finance Platform",
          url: "https://localhost:3000", // Update this to your domain in production
          icons: []
        }
      });
    } catch (error) {
      console.warn('Failed to initialize Web3Modal:', error);
    }
  }
  return web3Modal;
};

// Function to open the connect modal
export const openConnectModal = () => {
  const modal = initWeb3Modal();
  if (modal) {
    modal.open();
  }
};

export default function Web3Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on 400 errors
          if (error?.response?.status === 400) {
            return false;
          }
          return failureCount < 3;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }));
  
  return (
    // <QueryClientProvider client={queryClient}>
    //   <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
    //     <RelayKitProvider
    //       options={{
    //         appName: "OakSoft DeFi",
    //         chains: relayChains,
    //         baseApiUrl: MAINNET_RELAY_API,
    //         // Temporarily disable Dune to avoid CORS issues
    //         // ...(duneKey ? { duneConfig: { apiKey: duneKey } } : {}),
    //         themeScheme: "dark",
    //         autoConnect: false, // Prevent auto-connection
    //         source: "oaksoft-defi", // Add source identifier
    //       }}
    //     >
    //       {children}
    //     </RelayKitProvider>
    //   </WagmiProvider>
    // </QueryClientProvider>
    <QueryClientProvider client={queryClient}>
      <RelayKitProvider options={{ /* ... */ }}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          {children}
        </WagmiProvider>
      </RelayKitProvider>
    </QueryClientProvider>
  );
}
