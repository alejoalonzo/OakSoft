"use client";

import { useEffect, useRef, useState } from "react";
import SwapColumn from "../../components/Swap";
import TokenTVChart from "../../components/TokenTvChart";


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
  // Timings
  const HIDE_MS = 300;        // fade-out when hiding
  const WIDTH_MS = 420;       // column width (outer container)
  const SHOW_MS = 1200;       // chart reveal (reappearance)
  const SHOW_DELAY = 120;     // slight delay before triggering the reveal

  const [chartState, setChartState] = useState("visible"); // "visible" | "hiding" | "hidden" | "showing"
  const hideTimer = useRef(null);
  const showTimer = useRef(null);

  const TOKENS = ["DAI", "LINK", "USDC"]; // Changed order - DAI first
  const [selectedToken, setSelectedToken] = useState("DAI"); // Start with DAI instead of USDC


  const onToggleChart = () => {
    if (chartState === "visible" || chartState === "showing") {
      // HIDE: only fade and collapse width quickly
      setChartState("hiding");
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setChartState("hidden"), HIDE_MS);
    } else {
      // SHOW: expand container quickly and then REVEAL from right→left
      setChartState("showing"); // prepares w-0 for the reveal
      if (showTimer.current) clearTimeout(showTimer.current);
      showTimer.current = setTimeout(() => setChartState("visible"), SHOW_DELAY); // triggers the w-full reveal
    }
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, []);

  const isHidden = chartState === "hidden";
  const isCollapsing = chartState === "hiding" || chartState === "hidden"; // right side centers quickly

  // --- REVEAL MASK ---
  // The internal "reveal" sticks to the right (ml-auto) and animates width 0→100%.
  const revealWidthClass =
    chartState === "showing" ? "w-0"
    : chartState === "visible" ? "w-full"
    : chartState === "hiding" ? "w-full"
    : "w-0"; // hidden

  const revealOpacityClass =
    chartState === "showing" ? "opacity-0"
    : chartState === "visible" ? "opacity-100"
    : chartState === "hiding" ? "opacity-0"
    : "opacity-0";

  return (
    <div className="min-h-screen bg-gray-900 w-full">

      {/* Title */}
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
        <div className="flex flex-col lg:flex-row gap-8 relative">
          {/* LEFT (Chart) - outer container: reserved layout width */}
          <div
            className={[
              "overflow-hidden transition-[width] duration-[420ms]",
              "ease-[cubic-bezier(0.33,0,0.2,1)]",
              isCollapsing ? "w-0 lg:w-0" : "w-full lg:w-[60%]",
            ].join(" ")}
            aria-hidden={isHidden}
            style={{ transitionDuration: `${WIDTH_MS}ms` }}
          >
            {/* REVEAL: anchors to the right and expands its width (left border travels from right→left) */}
            <div
              className={[
                "ml-auto",                     // anchor to the right
                "transition-[width,opacity] ", // animate only width + opacity
                "duration-[1200ms]",
                "ease-[cubic-bezier(0.16,1,0.3,1)]",
                revealWidthClass,
                revealOpacityClass,
              ].join(" ")}
              style={{
                willChange: "width, opacity",
                transitionDuration:
                  chartState === "showing" || chartState === "visible"
                    ? `${SHOW_MS}ms`
                    : chartState === "hiding"
                    ? `${HIDE_MS}ms`
                    : undefined,
              }}
            >
              {/* Actual chart content */}
              <h2 className="text-white text-xl font-semibold mb-4">
                {selectedToken} Chart
              </h2>

              <div 
                className="h-[500px] w-full relative border border-white/10"
                style={{
                  borderRadius: '12px',
                  background: 'rgba(31, 41, 55, 1)',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    clipPath: 'inset(0px round 11px)',
                    WebkitClipPath: 'inset(0px round 11px)'
                  }}
                >
                  
                  <div className="flex items-center justify-center h-full text-gray-400">
                    {/* <TokenChart token={selectedToken} /> */}
                    {/* <DexScreenerChart tokenSymbol={selectedToken} /> */}
                    <TokenTVChart token={selectedToken} />

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT (Swap) */}
          <div
            className={[
              "transition-[width] duration-[420ms]",
              "ease-[cubic-bezier(0.33,0,0.2,1)]",
              isCollapsing ? "w-full lg:w-[720px] lg:max-w-[720px] mx-auto" : "lg:w-[40%]",
              isCollapsing ? "flex flex-col items-center text-center" : "",
            ].join(" ")}
            style={{ transitionDuration: `${WIDTH_MS}ms` }}
          >
            {/* Componente Swap directamente */}
            <div className={isCollapsing ? "flex flex-col items-center w-full" : ""}>
              <SwapColumn
                selectedToken={selectedToken}
                onSelectToken={setSelectedToken}
              />
            </div>

            {/* Botón Hide/Expand debajo del componente Swap */}
            <div className={["mt-6 flex", isCollapsing ? "justify-center" : "justify-center lg:justify-start"].join(" ")}>
              <button
                onClick={onToggleChart}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2 border border-white/30 text-white hover:border-white/60 transition"
                aria-pressed={!isHidden}
              >
                {isHidden ? (
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
