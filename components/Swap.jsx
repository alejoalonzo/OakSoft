// components/Swap.jsx
"use client";

import { LiFiWidget } from "@lifi/widget";
import { useWidgetEvents, WidgetEvent } from "@lifi/widget";
import { getToken } from "@lifi/sdk"; // <- to get Symbol, Name, etc.
import { useEffect, useMemo, useCallback, memo, useState } from "react";
import dynamic from "next/dynamic";


const WidgetEventBridge = memo(function WidgetEventBridge({ onSellTokenChange, onBuyTokenChange }) {
  const widgetEvents = useWidgetEvents();

  useEffect(() => {
    const fetchAndEmit = async (kind, { chainId, tokenAddress }) => {
      try {
        const tok = await getToken(chainId, tokenAddress);
        const symbol = tok?.symbol ? String(tok.symbol).toUpperCase() : null;
        const name = tok?.name || null;

        console.log(`[LI.FI ${kind}]`, {
          chainId,
          tokenAddress,
          symbol,
          name,
        });

        const payload = {
          symbol,                            // normalized
          name,                              // <- NEW
          address: tok?.address || tokenAddress || null,
          chainId: tok?.chainId || chainId || 1,
        };

        if (kind === "SOURCE") onSellTokenChange?.(payload);
        else onBuyTokenChange?.(payload);
      } catch (e) {
        console.warn(`[LI.FI ${kind}] token lookup failed`, {
          chainId,
          tokenAddress,
          error: e?.message,
        });

        const payload = {
          symbol: null,
          name: null,                        // <- NEW
          address: tokenAddress || null,
          chainId: chainId || 1,
        };
        (kind === "SOURCE" ? onSellTokenChange : onBuyTokenChange)?.(payload);
      }
    };


    const onSource = (p) => fetchAndEmit("SOURCE", p);
    const onDest = (p) => fetchAndEmit("DEST", p);

    // === Events ===
    widgetEvents.on(WidgetEvent.SourceChainTokenSelected, onSource);
    widgetEvents.on(WidgetEvent.DestinationChainTokenSelected, onDest);

    // Cleanup
    return () => widgetEvents.all.clear();
  }, [widgetEvents, onSellTokenChange, onBuyTokenChange]);

  return null;
});

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;

// Define widget config outside component to prevent recreation
const WIDGET_CONFIG = {
  variant: "compact",
  subvariant: "split", 
  subvariantOptions: { split: "swap" },
  appearance: "dark",
  theme: {
    container: { border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" },
  },
  // Clean wallet configuration - no conflicts since no Wagmi
  walletConfig: {
    autoConnect: false,
    // Pass WalletConnect projectId
    walletConnect: projectId ? {
      projectId: projectId,
    } : undefined,
  },
  // Add chains configuration - ALL LiFi supported chains
  chains: {
    allow: [
      // Major chains
      1,          // Ethereum
      56,         // BSC (Binance Smart Chain)
      137,        // Polygon
      42161,      // Arbitrum
      10,         // Optimism
      43114,      // Avalanche
      8453,       // Base
      250,        // Fantom
      100,        // Gnosis
      42220,      // Celo
      25,         // Cronos
      
      // Layer 2s and scaling solutions
      324,        // zkSync
      1101,       // Polygon zkEVM
      534352,     // Scroll
      59144,      // Linea
      81457,      // Blast
      5000,       // Mantle
      204,        // opBNB
      1088,       // Metis
      288,        // Boba
      34443,      // Mode
      42793,      // Etherlink
      252,        // Fraxtal
      480,        // World Chain
      60808,      // BOB
      167000,     // Taiko
      
      // Emerging and specialized chains
      1285,       // Moonriver
      1284,       // Moonbeam
      122,        // FUSE
      1135,       // Lisk
      130,        // Unichain
      1313161554, // Aurora
      1329,       // Sei
      1337,       // Hyperliquid
      13371,      // Immutable zkEVM
      14,         // Flare
      146,        // Sonic
      1480,       // Vana
      1625,       // Gravity
      1868,       // Soneium
      1923,       // Swellchain
      2020,       // Ronin
      21000000,   // Corn
      232,        // Lens
      2741,       // Abstract
      30,         // Rootstock
      33139,      // Apechain
      50,         // XDC
      50104,      // Sophon
      55244,      // Superposition
      57073,      // Ink
      747474,     // Katana
      80094,      // Berachain
      8217,       // Kaia
      9745,       // Plasma
      98866,      // Plume
      999,        // HyperEVM
    ],
  },
};

// Create a dynamic import to prevent SSR issues
const DynamicLiFiWidget = dynamic(
  () => import("@lifi/widget").then((mod) => mod.LiFiWidget),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-gray-800 rounded-xl border border-white/10 flex items-center justify-center">
        <div className="text-white">Loading widget...</div>
      </div>
    )
  }
);

// Wrapper component with better error handling
const LiFiWidgetWrapper = memo(function LiFiWidgetWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-800 rounded-xl border border-white/10 flex items-center justify-center">
        <div className="text-white">Initializing...</div>
      </div>
    );
  }

  return (
    <DynamicLiFiWidget 
      integrator="OakSoft DeFi" 
      config={WIDGET_CONFIG}
    />
  );
});

export default function SwapColumn({ onSellTokenChange, onBuyTokenChange }) {

  return (
    <div className="w-fit bg-gray-800 rounded-xl border border-white/10 p-4 space-y-3">
      {/* Event Listener */}
      <WidgetEventBridge
        onSellTokenChange={onSellTokenChange}
        onBuyTokenChange={onBuyTokenChange}
      />

      {/* Widget LI.FI */}
      <LiFiWidgetWrapper />
    </div>
  );
}
