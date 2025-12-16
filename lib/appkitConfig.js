// src/config/index.js

import { cookieStorage, createStorage, http } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  // EVM (most popular)
  mainnet,
  arbitrum,
  optimism,
  base,
  polygon,
  bsc,
  avalanche,
  linea,
  scroll,
  gnosis,

  // Non-EVM (multichain)
  solana,
  bitcoin,
  ton,
} from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// You can add more networks later if needed
export const networks = [
  // EVM
  mainnet,
  arbitrum,
  optimism,
  base,
  polygon,
  bsc,
  avalanche,
  linea,
  scroll,
  gnosis,

  // Non-EVM
  solana,
  bitcoin,
  ton,
];

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

// This is the wagmi config used by AppKit
export const config = wagmiAdapter.wagmiConfig;
