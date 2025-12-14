// components/Swap.jsx
"use client";

import { useEffect, useMemo, useCallback, memo, useState } from "react";
import dynamic from "next/dynamic";
import { useWidgetEvents, WidgetEvent } from "@lifi/widget";
import { getToken } from "@lifi/sdk";
import { useAppKit } from "@reown/appkit/react";

// Read WalletConnect projectId (AppKit / WC)
// Prefer Reown's NEXT_PUBLIC_PROJECT_ID, fallback to old NEXT_PUBLIC_WALLETCONNECT_ID if present
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_ID;

// Base widget config (no hooks here)
const BASE_WIDGET_CONFIG = {
  variant: "wide",
  subvariant: "swap",
  subvariantOptions: {
    wide: {
      enableChainSidebar: true,
    },
  },
  appearance: "dark",
  hiddenUI: ["poweredBy"], // Hides "Powered by LI.FI"
  theme: {
    palette: {
      mode: "dark",
      primary: { main: "#95E100" },
      secondary: { main: "#FFFFFF" },
      text: {
        primary: "#FFFFFF",
        secondary: "#CCCCCC",
      },
      background: {
        paper: "#1F2937",
        default: "#111827",
      },
    },
    shape: {
      borderRadius: 12,
      borderRadiusSecondary: 8,
    },
    container: {
      border: "none",
      borderRadius: "12px",
      background: "transparent",
      padding: "0px",
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: "transparent",
            color: "#FFFFFF",
            "& .MuiButton-root": { color: "#FFFFFF" },
            "& .MuiButton-outlined": {
              color: "#FFFFFF",
              borderColor: "rgba(255,255,255,0.28)",
            },
            "& .MuiChip-root": {
              color: "#FFFFFF",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderColor: "rgba(255,255,255,0.24)",
            },
            "& .MuiSvgIcon-root, & .MuiTypography-root": { color: "#FFFFFF" },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 10,
          },
          containedPrimary: {
            backgroundColor: "#95E100",
            color: "#0B1220",
            "&:hover": { backgroundColor: "#7AB800" },
          },
          outlined: {
            color: "#FFFFFF",
            borderColor: "rgba(255,255,255,0.25)",
            "&:hover": { borderColor: "rgba(255,255,255,0.45)" },
          },
          text: {
            color: "#FFFFFF",
          },
        },
      },
    },
  },
};

// Dynamic import to avoid SSR issues with the widget
const DynamicLiFiWidget = dynamic(
  () => import("@lifi/widget").then((mod) => mod.LiFiWidget),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-gray-800 rounded-xl border border-white/10 flex items-center justify-center">
        <div className="text-white">Loading widget...</div>
      </div>
    ),
  }
);

// Bridge between widget events and your app state
const WidgetEventBridge = memo(function WidgetEventBridge({
  onSellTokenChange,
  onBuyTokenChange,
}) {
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
          symbol,
          name,
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
          name: null,
          address: tokenAddress || null,
          chainId: chainId || 1,
        };
        (kind === "SOURCE" ? onSellTokenChange : onBuyTokenChange)?.(payload);
      }
    };

    const onSource = (p) => fetchAndEmit("SOURCE", p);
    const onDest = (p) => fetchAndEmit("DEST", p);

    widgetEvents.on(WidgetEvent.SourceChainTokenSelected, onSource);
    widgetEvents.on(WidgetEvent.DestinationChainTokenSelected, onDest);

    return () => widgetEvents.all.clear();
  }, [widgetEvents, onSellTokenChange, onBuyTokenChange]);

  return null;
});

// Wrapper that builds the final widget config using AppKit + partial wallet management
const LiFiWidgetWrapper = memo(function LiFiWidgetWrapper() {
  const [isClient, setIsClient] = useState(false);
  const { open } = useAppKit();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const config = useMemo(() => {
    return {
      ...BASE_WIDGET_CONFIG,
      walletConfig: {
        // When user clicks "Connect wallet" inside the widget,
        // open the Reown AppKit modal instead of the internal wallet menu
        onConnect() {
          open?.({ view: "Connect", namespace: "eip155" });
        },

        // Hybrid mode:
        // - EVM: uses external wallet management (AppKit/Wagmi, auto-detected)
        // - Other ecosystems (e.g. Solana, Bitcoin): internal widget wallet menu
        // See: Wallet Management > Partial Wallet Management
        // https://docs.li.fi/widget/wallet-management
        usePartialWalletManagement: true,

        // WalletConnect config for the widget's internal WalletConnect usage
        walletConnect: walletConnectProjectId
          ? { projectId: walletConnectProjectId }
          : undefined,
      },
    };
  }, [open]);

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-800 rounded-xl border border-white/10 flex items-center justify-center">
        <div className="text-white">Initializing...</div>
      </div>
    );
  }

  return (
    <DynamicLiFiWidget integrator="OakSoft DeFi" config={config} />
  );
});

export default function SwapColumn({ onSellTokenChange, onBuyTokenChange }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-white/10 overflow-hidden">
      <WidgetEventBridge
        onSellTokenChange={onSellTokenChange}
        onBuyTokenChange={onBuyTokenChange}
      />
      <LiFiWidgetWrapper />
    </div>
  );
}
