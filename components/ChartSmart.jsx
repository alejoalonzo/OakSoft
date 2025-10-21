// components/ChartSmart.jsx
"use client";

import { useEffect, useRef } from "react";

/* -----------------------------
   DEXTools slugs for supported chains
----------------------------------- */
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

/* -----------------------------
   Normalization map for TV tickers
   (these are NOT fallbacks)
----------------------------------- */
const TV_SYMBOL_MAP = {
  WETH: "ETH",
  WBTC: "BTC",
  WSOL: "SOL",
  WMATIC: "MATIC",
  WBNB: "BNB",
  WAVAX: "AVAX",
  WFTM: "FTM",
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

/* -----------------------------
   Helpers
----------------------------------- */
function toTvBase(symRaw) {
  if (!symRaw) return null;
  const s = String(symRaw).toUpperCase().replace(/[^\w]/g, "");
  return TV_SYMBOL_MAP[s] || s;
}

// Build a candidate list of TV symbols across multiple CEXes.
// Order: USD on US-facing CEX first, then USDT on global CEX.
const CANDIDATE_FNS = [
  (s) => `COINBASE:${s}USD`,
  (s) => `KRAKEN:${s}USD`,
  (s) => `BINANCE:${s}USDT`,
  (s) => `BYBIT:${s}USDT`,
  (s) => `KUCOIN:${s}USDT`,
  (s) => `GATEIO:${s}USDT`,
  (s) => `BITGET:${s}USDT`,
];

function tvCandidates(symbol) {
  const s = toTvBase(symbol);
  if (!s) return [];
  // Special known cases (DEX-only or rare on CEX): try USDT pairs where they exist
  if (s === "TOSHI") {
    return [
      "BYBIT:TOSHIUSDT",
      "KUCOIN:TOSHIUSDT",
      "GATEIO:TOSHIUSDT",
      "BITGET:TOSHIUSDT",
    ];
  }
  return CANDIDATE_FNS.map((f) => f(s));
}

// Small utility: clear all timeouts we create
function clearTimers(ref) {
  ref.current.forEach((t) => clearTimeout(t));
  ref.current = [];
}

/* -----------------------------
   Component
----------------------------------- */
export default function ChartSmart({ symbol, name, address, chainId }) {
  const el = useRef(null);
  const timersRef = useRef([]);              // keep track of timeouts
  const lastOkMapRef = useRef({});           // remember last working TV ticker per base symbol

  useEffect(() => {
    if (!el.current) return;

    // Cancel any pending timeouts and wipe DOM
    clearTimers(timersRef);
    el.current.innerHTML = "";

    // Debounce to avoid re-mounting TV multiple times when swaps fire rapidly
    const DEBOUNCE_MS = 450;
    const ATTEMPT_TIMEOUT_MS = 2000;

    let cancelled = false;

    const mountTradingView = (tvSymbol) => {
      if (cancelled) return;
      el.current.innerHTML = "";

      const tv = document.createElement("script");
      tv.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      tv.async = true;
      tv.innerHTML = JSON.stringify({
        autosize: true,
        symbol: tvSymbol,     // e.g. BINANCE:ETHUSDT
        theme: "dark",
        interval: "60",
        style: "3",
        hide_volume: true,
        withdateranges: true,
        locale: "en",
      });
      el.current.appendChild(tv);

      // Helpful log
      console.log("[ChartSmart] TV try:", tvSymbol);
    };

    const mountDEXTools = () => {
      if (!(address && SLUG[chainId])) return false;
      if (cancelled) return false;

      el.current.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.dextools.io/widget-chart/en/${SLUG[chainId]}/pe-dark/${address}`;
      Object.assign(iframe.style, { width: "100%", height: "100%", border: "0" });
      el.current.appendChild(iframe);

      console.log("[ChartSmart] DEXTools:", { chainId, address, slug: SLUG[chainId] });
      return true;
    };

    const mountMessage = () => {
      if (cancelled) return;
      el.current.innerHTML = "";
      const div = document.createElement("div");
      div.style.cssText =
        "display:flex;align-items:center;justify-content:center;height:100%;color:#9CA3AF;font:500 14px/1.2 ui-sans-serif,system-ui";
      div.textContent = name || symbol || "No chart available";
      el.current.appendChild(div);
      console.log("[ChartSmart] No chart available:", { symbol, name, chainId, address });
    };

    const run = () => {
      if (cancelled) return;

      const base = toTvBase(symbol);
      const candidatesRaw = tvCandidates(symbol);

      // Prioritize the last working candidate if we have one for this base symbol
      const lastOk = base && lastOkMapRef.current[base];
      const candidates =
        lastOk && candidatesRaw.includes(lastOk)
          ? [lastOk, ...candidatesRaw.filter((c) => c !== lastOk)]
          : candidatesRaw;

      let i = 0;

      const tryNext = () => {
        if (cancelled) return;

        // If no more TV candidates, try DEX, otherwise message
        if (i >= candidates.length) {
          if (!mountDEXTools()) mountMessage();
          return;
        }

        const candidate = candidates[i++];
        mountTradingView(candidate);

        // Heuristic: TradingView injects an <iframe>. If we don't see it soon, try next.
        const t = setTimeout(() => {
          if (cancelled) return;
          const hasTVIframe = !!el.current?.querySelector("iframe");
          if (hasTVIframe) {
            // Consider this mounted. Remember for future.
            if (base) lastOkMapRef.current[base] = candidate;
            console.log("[ChartSmart] TV mounted:", candidate);
            return;
          }
          // Otherwise, try next candidate
          tryNext();
        }, ATTEMPT_TIMEOUT_MS);
        timersRef.current.push(t);
      };

      tryNext();
    };

    // Debounce before running attempts
    const start = setTimeout(run, DEBOUNCE_MS);
    timersRef.current.push(start);

    // Cleanup
    return () => {
      cancelled = true;
      clearTimers(timersRef);
      if (el.current) el.current.innerHTML = "";
    };
  }, [symbol, name, address, chainId]);

  return <div ref={el} style={{ width: "100%", height: "100%" }} />;
}
