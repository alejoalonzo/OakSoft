"use client";
import { useMemo, useEffect, useState } from "react";
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
    address: "0x833589fCd6eDb6E08f4c7C32D4f71b54bDA02913", // USDC on Base - Verified
    decimals: 6,
    symbol: "USDC",
    name: "USD Coin",
  },
  DAI: {
    chainId: CHAIN_ID,
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // DAI on Base - Verified  
    decimals: 18,
    symbol: "DAI",
    name: "Dai",
  },
  LINK: {
    chainId: CHAIN_ID,
    address: "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196", // LINK on Base - Verified
    decimals: 18,
    symbol: "LINK",
    name: "Chainlink",
  },
};

export default function SwapColumn({ selectedToken, onSelectToken }) {
  const { isConnected } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  
  const tabs = useMemo(() => Object.keys(TOKEN_MAP), []);

  // Ensure we have a valid token selected
  const currentToken = TOKEN_MAP[selectedToken];
  
  // Initialize component with delay for USDC
  useEffect(() => {
    if (currentToken) {
      // Add extra delay for USDC to avoid conflicts
      const delay = selectedToken === 'USDC' ? 1000 : 300;
      const timer = setTimeout(() => {
        setIsInitialized(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [currentToken, selectedToken]);
  
  // Debug logging with more details
  useEffect(() => {
    console.log('SwapColumn updated:', {
      selectedToken,
      isConnected,
      isInitialized,
      fromToken: ETH_BASE,
      toToken: currentToken,
      tokenExists: !!currentToken,
      tokenAddress: currentToken?.address,
    });
  }, [selectedToken, isConnected, currentToken, isInitialized]);

  const onConnectWallet = () => {
    console.log('Manual wallet connection triggered');
    openConnectModal();
  };

  // Early return if token is not found
  if (!currentToken) {
    console.error('Token not found:', selectedToken);
    return (
      <div className="w-fit bg-gray-800 rounded-xl border border-white/10 p-4 space-y-3">
        <div className="text-red-400 text-center">
          Error: Token "{selectedToken}" not found
        </div>
      </div>
    );
  }

  // Show loading state until initialized
  if (!isInitialized) {
    return (
      <div className="w-fit bg-gray-800 rounded-xl border border-white/10 p-4 space-y-3">
        <div className="text-white/60 text-center">
          Loading swap widget...
        </div>
      </div>
    );
  }

  return (
    <div className="w-fit bg-gray-800 rounded-xl border border-white/10 p-4 space-y-3">
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
        toToken={currentToken}
        setToToken={() => {}}
        supportedWalletVMs={["evm"]}
        onConnectWallet={onConnectWallet}
        defaultAmount={selectedToken === 'USDC' ? "0.005" : "0.01"} // Smaller amount for USDC
        lockChainId={CHAIN_ID}
        singleChainMode
        enableWalletAggregator={false} // Disable auto wallet aggregation
        key={`${selectedToken}-${isInitialized}-${Date.now()}`} // Force complete re-render
        onError={(error) => {
          console.warn('SwapWidget error for', selectedToken, ':', error);
        }}
        // Additional props to prevent conflicts
        disableAnalytics={true}
        disableTelemetry={true}
      />
    </div>
  );
}
