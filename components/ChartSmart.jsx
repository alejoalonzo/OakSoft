// components/ChartSmart.jsx
"use client";
import { useEffect, useRef } from "react";

// DEXTools slugs for supported chains
const SLUG = {
  1: "ether",
  10: "optimism",
  56: "bsc",
  100: "gnosis",
  137: "polygon",
  324: "zksync",
  8453: "base",
  42161: "arbitrum",
  43114: "avalanche",
  59144: "linea",
  81457: "blast",
  5000: "mantle",
};

// Normalized symbols mapping for TradingView
const TV_SYMBOL_MAP = {
  WETH: "ETH",
  WBTC: "BTC",
  USDC: "USDC",
  USDT: "USDT",
  DAI: "DAI",
  MATIC: "MATIC", 
  POL: "POL",
  ARB: "ARB",
  OP: "OP",
  AVAX: "AVAX",
  BNB: "BNB",
  SOL: "SOL",
};

function toTvBase(symRaw) {
  if (!symRaw) return null;
  const s = String(symRaw).toUpperCase().replace(/[^\w]/g, "");
  return TV_SYMBOL_MAP[s] || s;
}

/**
 * Gadgets to build the TradingView.
 */
function tvCandidates(symbol) {
  const s = toTvBase(symbol);
  if (!s) return [];
  const list = [];
  // Primero USD (CEX USA), luego USDT (CEX global)
  list.push(`COINBASE:${s}USD`);
  list.push(`BINANCE:${s}USDT`);
  return list;
}

export default function ChartSmart({ symbol, name, address, chainId }) {
  const el = useRef(null);

  useEffect(() => {
    if (!el.current) return;
    el.current.innerHTML = "";

    const candidates = tvCandidates(symbol);

    // try 1: TradingView with CEX symbol
    if (candidates.length > 0) {
      const [tv1] = candidates;
      const tv = document.createElement("script");
      tv.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      tv.async = true;
      tv.innerHTML = JSON.stringify({
        autosize: true,
        symbol: tv1,               // e.g. "BINANCE:ETHUSDT"
        theme: "dark",
        interval: "60",
        style: "3",
        hide_volume: true,
        withdateranges: true,
        locale: "en",
      });
      el.current.appendChild(tv);

      console.log("[ChartSmart] TradingView symbol:", tv1);
      return;
    }

    // try 2: DEXTools (if we have address+chainId with known slug)
    if (address && SLUG[chainId]) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.dextools.io/widget-chart/en/${SLUG[chainId]}/pe-dark/${address}`;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "0";
      el.current.appendChild(iframe);

      console.log("[ChartSmart] DEXTools:", { chainId, address, slug: SLUG[chainId] });
      return;
    }

    // Fallback: friendly message if we can't show anything
    const div = document.createElement("div");
    div.style.cssText = "display:flex;align-items:center;justify-content:center;height:100%;color:#9CA3AF";
    div.textContent = name || symbol || "No chart available";
    el.current.appendChild(div);
    console.log("[ChartSmart] No chart available:", { symbol, name, chainId, address });
  }, [symbol, name, address, chainId]);

  return <div ref={el} style={{ width: "100%", height: "100%" }} />;
}
