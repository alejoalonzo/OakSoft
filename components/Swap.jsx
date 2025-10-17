"use client";

import { useMemo } from "react";
import { SwapWidget } from "@relayprotocol/relay-kit-ui";
import { openConnectModal } from "../providers/AppProviders";

export default function SwapColumn({ selectedToken, onSelectToken }) {
  
  const tabs = useMemo(() => ["USDC", "DAI", "LINK"], []);

  const onConnectWallet = () => {
    openConnectModal(); 
  };

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

      {/* SwapWidget multichain: without chain lock or fixed tokens */}
      <SwapWidget
        supportedWalletVMs={["evm"]}
        onConnectWallet={onConnectWallet}
        onError={(err) => console.warn("SwapWidget error:", err)}
      />
    </div>
  );
}
