// ChartSmart.jsx
"use client";
import { useEffect, useRef } from "react";

const SLUG = { 1:"ether", 8453:"base", 42161:"arbitrum", 10:"optimism" }; // I can add more if needed

function tvGuess(sym) {
  const s = (sym||"ETH").toUpperCase();
  return [`BINANCE:${s}USDT`, `COINBASE:${s}USD`];
}

export default function ChartSmart({ symbol, address, chainId }) {
  const el = useRef(null);

  useEffect(() => {
    if (!el.current) return;
    el.current.innerHTML = "";

    // 1) TradingView direct to regular symbols
    const [tv1] = tvGuess(symbol);
    const tv = document.createElement("script");
    tv.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    tv.async = true;
    tv.innerHTML = JSON.stringify({ autosize:true, symbol:tv1, theme:"dark", interval:"60", style:"3", hide_volume:true, withdateranges:true, locale:"en" });
    el.current.appendChild(tv);

    // 2) Fallback to DEXTools (TradingView inside) if no CEX
    //    (simple: if no address or supported chain, no fallback)
    const useDex = !symbol || !symbol.match(/^[a-z0-9]+$/i); 
    if (address && SLUG[chainId] && useDex) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.dextools.io/widget-chart/en/${SLUG[chainId]}/pe-dark/${address}`;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "0";
      el.current.innerHTML = "";
      el.current.appendChild(iframe);
    }
  }, [symbol, address, chainId]);

  return <div ref={el} style={{ width:"100%", height:"100%" }} />;
}
