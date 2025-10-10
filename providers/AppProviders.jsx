'use client'

// Global providers for data fetching (React Query), Relay UI, and Wagmi (wallet state)
import { RelayKitProvider } from '@relayprotocol/relay-kit-ui'
import {
  convertViemChainToRelayChain,
  MAINNET_RELAY_API,
} from '@relayprotocol/relay-sdk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { createConfig, http, WagmiProvider } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors' // enables MetaMask / Coinbase / Brave

const queryClient = new QueryClient()

// Relay needs its own chain format; convert viem/wagmi chain -> Relay chain
const relayChains = [convertViemChainToRelayChain(mainnet)]

// Minimal Wagmi config: HTTP transport + an injected connector for EVM wallets
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
  connectors: [injected()],
})

export default function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RelayKitProvider
        options={{
          appName: 'OakSoft DeFi',
          // Your app fee in basis points (100 = 1%). Change recipient to your address.
          appFees: [{ recipient: '0xYourAddressHere...', fee: '100' }],
          // Optional Dune API key to enable insights/charts
          duneConfig: process.env.NEXT_PUBLIC_DUNE_API_KEY
            ? { apiKey: process.env.NEXT_PUBLIC_DUNE_API_KEY }
            : undefined,
          chains: relayChains,
          baseApiUrl: MAINNET_RELAY_API,
        }}
      >
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </RelayKitProvider>
    </QueryClientProvider>
  )
}
