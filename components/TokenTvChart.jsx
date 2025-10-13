"use client";
import { useEffect, useRef } from "react";

// Mapping of token to TradingView symbol
const TV_SYMBOL = {
  USDC: "BINANCE:ETHUSDC",   // ETH/USDC
  DAI:  "BINANCE:DAIUSDT",   // DAI/USDT (if you want ETH/DAI find a pair that exists in your preferred CEX)
  LINK: "BINANCE:LINKUSDT",  // LINK/USDT
};

export default function TokenTVChart({ token }) {
  const el = useRef(null);

  useEffect(() => {
    if (!el.current) return;
    el.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: TV_SYMBOL[token] || "BINANCE:ETHUSDT", // fallback
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "3",
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: false,
      calendar: false,
      hide_volume: false,
      locale: "en",
    });

    el.current.appendChild(script);
  }, [token]);

  return (
    <div
      ref={el}
      className="tradingview-widget-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
