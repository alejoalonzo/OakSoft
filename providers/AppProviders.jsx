"use client";

import { RelayKitProvider } from "@relayprotocol/relay-kit-ui";
import { MAINNET_RELAY_API, convertViemChainToRelayChain } from "@relayprotocol/relay-sdk";
import { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { mainnet, base, arbitrum, optimism } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;
const duneKey = process.env.NEXT_PUBLIC_DUNE_API_KEY;

const relayChains = [convertViemChainToRelayChain(base)];

const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, optimism],
  connectors: [
    walletConnect({
      projectId,
      showQrModal: false, // Prevent auto-popup
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
});

//Modal CONECT WALLET****
// Create Web3Modal configuration - its initialized only when needed
let web3Modal;

// function to initialize the modal only when needed
export const initWeb3Modal = () => {
  if (typeof window !== 'undefined' && projectId && !web3Modal) {
    web3Modal = createWeb3Modal({
      wagmiConfig,                               
      projectId: projectId,
      chains: [base, mainnet, arbitrum, optimism],
      themeMode: 'dark',
      enableAnalytics: false, // Disable analytics to prevent auto-opens
      enableOnramp: false, // Disable onramp features
    });
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
      },
    },
  }));
  
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RelayKitProvider
          options={{
            appName: "OakSoft DeFi",
            chains: relayChains,
            baseApiUrl: MAINNET_RELAY_API,
            ...(duneKey ? { duneConfig: { apiKey: duneKey } } : {}),
            themeScheme: "dark",
            // appFees: [{ recipient: "0x...", fee: "100" }], // opcional (1%)
            autoConnect: false, // Prevent auto-connection
          }}
        >
          {children}
        </RelayKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
