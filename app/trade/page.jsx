"use client";

import { SwapWidget } from "@relayprotocol/relay-kit-ui";
import { useConnect } from "wagmi";
import SimpleTradingViewWidget from "../../components/SimpleTradingViewWidget";
import ClientOnly from "../../components/ClientOnly";

export default function Trade() {
  const { connect, connectors } = useConnect();
  const connectInjected = () => {
    const injected = connectors.find(c => c.id === "injected") || connectors[0];
    if (injected) connect({ connector: injected });
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
          <div className="order-1">
            <h2 className="text-white text-xl font-semibold mb-4">ETH/USDT Chart</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <ClientOnly fallback={
                <div className="h-[500px] flex items-center justify-center text-white bg-gray-800 rounded">
                  <div className="text-center">
                    <div className="animate-pulse bg-gray-700 h-8 w-32 mx-auto mb-2 rounded"></div>
                    <p>Loading chart...</p>
                  </div>
                </div>
              }>
                <SimpleTradingViewWidget symbol="ETHUSDT" />
              </ClientOnly>
            </div>
          </div>

          <div className="order-2">
            <h2 className="text-white text-xl font-semibold mb-4 text-center lg:text-left">Quick Swap</h2>
            <button onClick={connectInjected} className="mb-4 rounded-xl px-6 py-3 bg-accent hover:bg-primary-400 text-black font-semibold transition-colors block mx-auto lg:mx-0">
              Connect wallet
            </button>

            <ClientOnly fallback={
              <div className="bg-gray-800 rounded-lg p-8 text-center text-white">
                Loading swap widget...
              </div>
            }>
              <SwapWidget
                supportedWalletVMs={['evm']}
                onConnectWallet={connectInjected}
              />
            </ClientOnly>
          </div>
        </div>
      </div>
    </div>
  );
}
