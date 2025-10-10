"use client";

import { useEffect, useRef, useState } from "react";

export default function SimpleTradingViewWidget({ symbol = "ETHUSDT" }) {
  const container = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear any existing content
    container.current.innerHTML = "";
    setIsLoading(true);
    setError(null);

    try {
      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        console.log("Simple TradingView script loaded");
        setTimeout(() => setIsLoading(false), 1000);
      };

      script.onerror = () => {
        console.error("Failed to load simple TradingView script");
        setError("Failed to load chart");
        setIsLoading(false);
      };

      script.innerHTML = JSON.stringify({
        symbols: [[symbol, `${symbol}|1D`]],
        chartOnly: false,
        width: "100%",
        height: "500",
        locale: "en",
        colorTheme: "dark",
        autosize: true,
        showVolume: false,
        showMA: false,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
        scalePosition: "right",
        scaleMode: "Normal",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        fontSize: "10",
        noTimeScale: false,
        valuesTracking: "1",
        changeMode: "price-and-percent",
        chartType: "area",
      });

      container.current.appendChild(script);
    } catch (err) {
      console.error("Error creating simple TradingView widget:", err);
      setError("Error creating chart");
      setIsLoading(false);
    }
  }, [symbol]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-800 rounded-xl text-red-400">
        <div className="text-center">
          <p>⚠️ Chart unavailable</p>
          <p className="text-sm mt-2">{symbol}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-xl text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading {symbol}...</p>
          </div>
        </div>
      )}
      <div
        ref={container}
        className="tradingview-widget-container bg-gray-800 rounded-xl h-full w-full"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
