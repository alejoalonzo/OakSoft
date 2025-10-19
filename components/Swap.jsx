// components/Swap.jsx
"use client";

import { useEffect } from "react";
import { LiFiWidget, useWidgetEvents, WidgetEvent } from "@lifi/widget";
import { openConnectModal } from "../providers/AppProviders";

/**
 * We replace Relay's <SwapWidget/> with LI.FI's <LiFiWidget/>.
 * We keep the same props so the rest of your app (Trade + ChartSmart) keeps working.
 *
 * onSellTokenChange / onBuyTokenChange receive { symbol?, address?, chainId? }.
 * LI.FI events give us chainId + tokenAddress; symbol may be unknown, so we pass null.
 * Your ChartSmart already falls back to DEXTools when it gets {address+chainId} without symbol.
 */
export default function SwapColumn({ onSellTokenChange, onBuyTokenChange }) {
  const widgetEvents = useWidgetEvents();

  // Subscribe to token/chain selection events and mirror them to parent
  useEffect(() => {
    // Source (SELL) updated
    const onSource = ({ chainId, tokenAddress }) => {
      onSellTokenChange?.({
        symbol: null,            // unknown here; ChartSmart can use address+chainId
        address: tokenAddress || null,
        chainId: chainId || 1,
      });
    };
    // Destination (BUY) updated
    const onDest = ({ chainId, tokenAddress }) => {
      onBuyTokenChange?.({
        symbol: null,
        address: tokenAddress || null,
        chainId: chainId || 1,
      });
    };

    widgetEvents.on(WidgetEvent.SourceChainTokenSelected, onSource);
    widgetEvents.on(WidgetEvent.DestinationChainTokenSelected, onDest);

    return () => widgetEvents.all.clear();
  }, [widgetEvents, onSellTokenChange, onBuyTokenChange]);

  // Minimal widget config to fit your right column
  const widgetConfig = {
    // UI/Variant
    variant: "compact",                 // fits well in a sidebar/card
    subvariant: "split",
    subvariantOptions: { split: "swap" }, // show only Swap UI (no tabs)
    appearance: "dark",
    theme: {
      container: {
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
      },
    },

    // Initial values (optional)
    // fromChain: 1,  // ETH Mainnet
    // toChain: 1,

    // Wallet behavior: reuse your Wagmi + Web3Modal, but define a handler for "Connect wallet" button
    walletConfig: {
      onConnect: openConnectModal, // opens your external wallet modal
    },

    // If later you want to restrict/allow chains/tokens/bridges:
    // chains: { allow: [1, 8453, 42161, 10] },
    // tokens: { /* allow/deny/include/featured */ },
    // exchanges: { allow: ["uniswapv3", "sushiswap"] },
    // bridges: { allow: ["stargate", "hop"] },
  };

  return (
    <div className="w-fit bg-gray-800 rounded-xl border border-white/10 p-4 space-y-3">
      {/* LI.FI Widget (client-side) */}
      <LiFiWidget integrator="OakSoft DeFi" config={widgetConfig} />
    </div>
  );
}
