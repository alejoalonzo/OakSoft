"use client";

import { SwapWidget } from "@relayprotocol/relay-kit-ui";
import { useConnect } from "wagmi";
import SimpleTradingViewWidget from "../../components/SimpleTradingViewWidget";
import ClientOnly from "../../components/ClientOnly";
import { useEffect, useRef, useState } from "react";

// Wrapper component to handle hydration issues with SwapWidget
function SwapWidgetWrapper({ onConnectWallet }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center text-white">
        Loading swap widget...
      </div>
    );
  }

  return <SwapWidget supportedWalletVMs={["evm"]} onConnectWallet={onConnectWallet} />;
}

function EyeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" strokeWidth="2" />
    </svg>
  );
}
function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M3 3l18 18" />
      <path strokeWidth="2" d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.42-4.42M9.88 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a20.34 20.34 0 01-5.07 6.13M6.61 6.61A20.78 20.78 0 001 12s4 8 11 8a10.77 10.77 0 005.39-1.46" />
    </svg>
  );
}

export default function Trade() {
  const { connect, connectors } = useConnect();
  const connectInjected = () => {
    const injected = connectors.find((c) => c.id === "injected") || connectors[0];
    if (injected) connect({ connector: injected });
  };

  const ANIM_MS = 700;
  const HIDE_DELAY_MS = 100;
  const [chartState, setChartState] = useState("visible"); // "visible" | "hiding" | "hidden" | "showing"
  const hideTimer = useRef(null);
  const showTimer = useRef(null);

  const onToggleChart = () => {
    if (chartState === "visible" || chartState === "showing") {
      setChartState("hiding");
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setChartState("hidden"), HIDE_DELAY_MS);
    } else {
      setChartState("showing");
      if (showTimer.current) clearTimeout(showTimer.current);
      showTimer.current = setTimeout(() => setChartState("visible"), ANIM_MS);
    }
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, []);

  const chartVisible = chartState === "visible" || chartState === "showing" || chartState === "hiding";

  return (
    <div className="min-h-screen bg-gray-900 w-full">
      <div
        className="flex justify-center pt-[60px] mb-[60px]"
        style={{ width: "292.07px", height: "76.8px", marginLeft: "auto", marginRight: "auto" }}
      >
        <h1
          className="text-white text-center align-middle uppercase"
          style={{
            fontFamily: "var(--font-abhaya-libre), serif",
            fontWeight: 800,
            fontSize: "48px",
            lineHeight: "76.8px",
            letterSpacing: "11px",
          }}
        >
          TRADE
        </h1>
      </div>

      <div className="w-full max-w-none mx-auto px-6 py-8 mt-[100px] lg:max-w-[calc(100%-200px)]">
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          {/* Chart column */}
          <div 
            className={[
              "lg:w-[60%] transition-all duration-700 ease-out",
              chartState === "hidden" 
                ? "lg:opacity-0 lg:transform lg:scale-95 lg:-translate-x-full" 
                : chartState === "hiding"
                ? "lg:opacity-0 lg:transform lg:scale-100 lg:translate-x-0"
                : "lg:opacity-100 lg:transform lg:scale-100 lg:translate-x-0"
            ].join(" ")}
          >
            {chartVisible && (
              <div 
                className={[
                  "w-full transition-opacity duration-700 ease-out",
                  chartState === "hiding" ? "opacity-0" : "opacity-100"
                ].join(" ")}
              >
                <h2 className="text-white text-xl font-semibold mb-4">ETH/USDT Chart</h2>
                <div className="bg-gray-800 rounded-lg p-4">
                  <ClientOnly
                    fallback={
                      <div className="h-[500px] flex items-center justify-center text-white bg-gray-800 rounded">
                        <div className="text-center">
                          <div className="animate-pulse bg-gray-700 h-8 w-32 mx-auto mb-2 rounded"></div>
                          <p>Loading chart...</p>
                        </div>
                      </div>
                    }
                  >
                    <SimpleTradingViewWidget symbol="ETHUSDT" />
                  </ClientOnly>
                </div>
              </div>
            )}
          </div>

          {/* Swap column */}
          <div
            className={[
              "lg:w-[40%] transition-all duration-700 ease-out",
              chartState === "hidden" 
                ? "lg:transform lg:-translate-x-[calc(60%+2rem)] lg:w-[720px] lg:max-w-[720px] lg:mx-auto" 
                : "lg:transform lg:translate-x-0"
            ].join(" ")}
          >
            <h2 className="text-white text-xl font-semibold mb-4 text-center lg:text-left">Quick Swap</h2>

            <button
              onClick={connectInjected}
              className="mb-4 rounded-xl px-6 py-3 bg-accent hover:bg-primary-400 text-black font-semibold transition-colors block mx-auto lg:mx-0"
            >
              Connect wallet
            </button>

            <ClientOnly
              fallback={
                <div className="bg-gray-800 rounded-lg p-8 text-center text-white">
                  Loading swap widget...
                </div>
              }
            >
              <SwapWidgetWrapper onConnectWallet={connectInjected} />
            </ClientOnly>

            <div className="mt-4 flex justify-center lg:justify-start">
              <button
                onClick={onToggleChart}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2 border border-white/30 text-white hover:border-white/60 transition"
                aria-pressed={chartState !== "hidden"}
              >
                {chartState === "hidden" ? (
                  <>
                    <EyeIcon className="w-5 h-5" />
                    Expand chart
                  </>
                ) : (
                  <>
                    <EyeOffIcon className="w-5 h-5" />
                    Hide chart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
