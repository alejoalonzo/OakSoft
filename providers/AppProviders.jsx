"use client";

import { RelayKitProvider } from "@relayprotocol/relay-kit-ui";
import { MAINNET_RELAY_API, convertViemChainToRelayChain } from "@relayprotocol/relay-sdk";
import { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
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
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
});

export default function Web3Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
          <RelayKitProvider
            options={{
              appName: "OakSoft DeFi",
              chains: relayChains,
              baseApiUrl: MAINNET_RELAY_API,
              ...(duneKey ? { duneConfig: { apiKey: duneKey } } : {}),
              themeScheme: "dark",
              // appFees: [{ recipient: "0x...", fee: "100" }], // opcional (1%)
            }}
    ></RelayKitProvider>
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    </QueryClientProvider>
  );
}
