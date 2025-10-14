"use client";
import { useEffect, useRef } from "react";

// Mapping of token to TradingView symbol
/*const TV_SYMBOL = {
  USDC: "BINANCE:ETHUSDC",   // ETH/USDC
  DAI:  "BINANCE:DAIUSDT",   // DAI/USDT (if you want ETH/DAI find a pair that exists in your preferred CEX)
  LINK: "BINANCE:LINKUSDT",  // LINK/USDT
};*/

const TV_MAP = {
  USDC: {
    // ETH/USDC
    symbol: "BINANCE:ETHUSDC",
    watchlist: ["BINANCE:ETHUSDC", "COINBASE:ETHUSDC"]
  },
  DAI: {
    // DAI/USD (more reliable than ETH/DAI)
    symbol: "KRAKEN:DAIUSD",                // <-- use this by default
    watchlist: ["KRAKEN:DAIUSD", "BINANCE:DAIUSDT", "COINBASE:DAIUSD"]
  },
  LINK: {
    // LINK/USDT (classic in CEX). If you prefer ETH base: BINANCE:LINKETH
    symbol: "BINANCE:LINKUSDT",
    watchlist: ["BINANCE:LINKUSDT", "COINBASE:LINKUSD", "BINANCE:LINKETH"]
  }
};


export default function TokenTVChart({ token }) {
  const el = useRef(null);

useEffect(() => {
  if (!el.current) return;
  el.current.innerHTML = "";

  const cfg = TV_MAP[token] || TV_MAP.USDC; // ✅ define cfg

  const script = document.createElement("script");
  script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  script.async = true;
  script.innerHTML = JSON.stringify({
    autosize: true,
    symbol: cfg.symbol,                    // ✅ use cfg
    watchlist: cfg.watchlist || [],        // ✅ use cfg
    interval: "60",
    timezone: "Etc/UTC",
    theme: "dark",
    style: "3",                            // AREA
    hide_volume: true,
    withdateranges: true,
    allow_symbol_change: true,
    hide_side_toolbar: false,
    calendar: false,
    locale: "en"
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
