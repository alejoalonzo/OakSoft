"use client";
import { useMemo } from "react";
import { SwapWidget } from "@relayprotocol/relay-kit-ui";
import { useConnect } from "wagmi";
import { useAccount } from "wagmi";
import { openConnectModal } from "../providers/AppProviders";

const CHAIN_ID = 8453; // Base

const ETH_BASE = {
  chainId: CHAIN_ID,
  address: "0x0000000000000000000000000000000000000000",
  decimals: 18,
  symbol: "ETH",
  name: "Ether",
};

const TOKEN_MAP = {
  USDC: {
    chainId: CHAIN_ID,
    address: "0x833589fCd6eDb6E08f4c7C32D4f71b54bDA02913",
    decimals: 6,
    symbol: "USDC",
    name: "USD Coin",
  },
  DAI: {
    chainId: CHAIN_ID,
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    decimals: 18,
    symbol: "DAI",
    name: "Dai",
  },
  LINK: {
    chainId: CHAIN_ID,
    address: "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196",
    decimals: 18,
    symbol: "LINK",
    name: "Chainlink",
  },
};

export default function SwapColumn({ selectedToken, onSelectToken }) {
  const { isConnected } = useAccount();
  
  const tabs = useMemo(() => Object.keys(TOKEN_MAP), []);

  // Debug logging
  console.log('SwapColumn rendered with:', {
    selectedToken,
    isConnected,
    fromToken: ETH_BASE,
    toToken: TOKEN_MAP[selectedToken]
  });

  const onConnectWallet = () => {
    console.log('Manual wallet connection triggered');
    openConnectModal();
  };

  return (
    <div className="w-full bg-gray-800 rounded-xl border border-white/10 p-4 space-y-3">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onSelectToken(t)}
            className={[
              "px-3 py-1 rounded-full border text-sm",
              t === selectedToken
                ? "border-white/60 bg-white/10 text-white"
                : "border-white/20 text-white/80 hover:border-white/40",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Widget: Sell = ETH fixed, Buy = token selected */}
        <SwapWidget
          fromToken={ETH_BASE}
          setFromToken={() => {}}
          lockFromToken
          toToken={TOKEN_MAP[selectedToken]}
          setToToken={() => {}}
          supportedWalletVMs={["evm"]}
          onConnectWallet={onConnectWallet}
          defaultAmount={"0.1"}
          lockChainId={CHAIN_ID}
          singleChainMode
          enableWalletAggregator={false} // Disable auto wallet aggregation
        />
    </div>
  );
}
