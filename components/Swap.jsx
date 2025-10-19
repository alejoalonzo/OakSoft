// components/Swap.jsx
"use client";

import { LiFiWidget } from "@lifi/widget";
import { useWidgetEvents, WidgetEvent } from "@lifi/widget";
import { getToken } from "@lifi/sdk"; // <- to get Symbol, Name, etc.
import { useEffect, useMemo, useCallback, memo } from "react";
import { openConnectModal } from "../providers/AppProviders";


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

export default function SwapColumn({ onSellTokenChange, onBuyTokenChange }) {
  // Memoize the onConnect callback to prevent recreation
  const memoizedOnConnect = useCallback(() => {
    openConnectModal();
  }, []);

  // Memoize the widget configuration to prevent infinite re-renders
  const widgetConfig = useMemo(() => ({
    variant: "compact",
    subvariant: "split",
    subvariantOptions: { split: "swap" },
    appearance: "dark",
    theme: {
      container: { border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" },
    },
    walletConfig: { onConnect: memoizedOnConnect },
  }), [memoizedOnConnect]);

  return (
    <div className="w-fit bg-gray-800 rounded-xl border border-white/10 p-4 space-y-3">
      {/* Event Listener */}
      <WidgetEventBridge
        onSellTokenChange={onSellTokenChange}
        onBuyTokenChange={onBuyTokenChange}
      />

      {/* Widget LI.FI */}
      <LiFiWidget integrator="OakSoft DeFi" config={widgetConfig} />
    </div>
  );
}
