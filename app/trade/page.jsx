"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import SwapColumn from "../../components/Swap";
import ChartSmart from "../../components/ChartSmart";


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
function shorten(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}
function displayToken(t, fallback = "TOKEN") {
  // Priority: SYMBOL > NAME (upper 1st word) > short address > fallback
  if (t?.symbol) return t.symbol;
  if (t?.name) return String(t.name).toUpperCase().split(" ")[0];
  if (t?.address) return shorten(t.address);
  return fallback;
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

  const [sell, setSell] = useState({ symbol: "ETH", name: "ETHEREUM", address: null, chainId: 1 });
  const [buy,  setBuy ] = useState({ symbol: "USDC", name: "USD COIN", address: null, chainId: 1 });

  const [activeTab, setActiveTab] = useState("SELL"); // "SELL" | "BUY"
  const current = activeTab === "SELL" ? sell : buy;

const handleSellTokenChange = useCallback((t) => {
  setSell({
    symbol: (t?.symbol || null) ? String(t.symbol).toUpperCase() : null,
    name: t?.name || null,
    address: t?.address || t?.token?.address || null,
    chainId: t?.chainId || t?.token?.chainId || 1,
  });
}, []);

const handleBuyTokenChange = useCallback((t) => {
  setBuy({
    symbol: (t?.symbol || null) ? String(t.symbol).toUpperCase() : null,
    name: t?.name || null,
    address: t?.address || t?.token?.address || null,
    chainId: t?.chainId || t?.token?.chainId || 1,
  });
}, []);

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

    const iconBaseStyle = {
      width: "68px",
      height: "68px",
      padding: "20px",
      boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
      backdropFilter: "blur(20.138256072998047px)",
      WebkitBackdropFilter: "blur(20.138256072998047px)",
    };

  return (
    <div className="min-h-screen bg-transparent w-full">

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

      {/* Main Trade Section */}
      <div className="w-full mt-[100px]" style={{ background: "#151A23" }}>
        <div className="w-full max-w-none mx-auto px-6 py-8 mt-[100px] lg:max-w-[calc(100%-200px)]">
          <div className="flex flex-col lg:flex-row gap-8 relative">
            {/* LEFT (Chart) - outer container: reserved layout width */}
            <div
              className={[
                "overflow-hidden transition-[width,height] duration-[420ms]",
                "ease-[cubic-bezier(0.33,0,0.2,1)]",
                isCollapsing ? "w-0 h-0 lg:h-auto lg:w-0" : "w-full lg:w-[60%]",
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
                {/* TOKEN TABS AS TITLES */}
                <div className="mb-6 flex gap-1">
                  <button
                    onClick={() => setActiveTab("SELL")}
                    className={`text-2xl font-semibold transition-all duration-200 ${
                      activeTab === "SELL" 
                        ? "text-white border-b-2 border-red-400 pb-1" 
                        : "text-white/60 hover:text-white/80 pb-1"
                    }`}
                  >
                    {displayToken(sell, "SELL")}

                  </button>
                  <span className="text-white/40 text-2xl font-semibold self-end pb-1 mx-2">/</span>
                  <button
                    onClick={() => setActiveTab("BUY")}
                    className={`text-2xl font-semibold transition-all duration-200 ${
                      activeTab === "BUY" 
                        ? "text-white border-b-2 border-green-400 pb-1" 
                        : "text-white/60 hover:text-white/80 pb-1"
                    }`}
                  >
                    {displayToken(buy, "BUY")}
                  </button>
                </div>

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
                      <ChartSmart   
                        symbol={current.symbol}
                        name={current.name}
                        address={current.address}
                        chainId={current.chainId} />
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
              {/* SWAP TITLE */}
              {/* <div className={["mb-6", isCollapsing ? "text-center" : "text-center lg:text-left"].join(" ")}>
                <h2 className="text-white text-2xl font-semibold">SWAP</h2>
              </div> */}

              {/* component SwapColumn */}
              <div className={isCollapsing ? "flex flex-col items-center w-full" : "md:flex md:justify-center lg:justify-start"}>
                <SwapColumn
                  onSellTokenChange={handleSellTokenChange}
                  onBuyTokenChange={handleBuyTokenChange}
                />
              </div>

              {/* TOGGLE BUTTON */}
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

      {/* Section Experience institutional-grade trading infrastructure */}
      <div className="w-full" style={{ background: "#151A23" }}>
        <section className="w-full flex justify-center py-[60px]">
            {/* Card */}
            <div
              className="w-full max-w-[1276px] h-auto rounded-[16px] px-[60px] py-[48px] flex flex-col"
              style={{
                background: "#161B26",
                filter:
                  "drop-shadow(0 9px 25.5px rgba(0, 0, 0, 0.50)) drop-shadow(-6px -7px 42px rgba(75, 84, 98, 0.25))",
              }}
            >
              {/* Row 1: Title */}
              <div className="w-full flex justify-center mb-[40px]">
                <h2
                  className="text-white text-center"
                  style={{
                    fontFamily: '"Gramatika Trial", sans-serif',
                    fontSize: "48px",
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "54px",
                  }}
                >
                  Experience institutional-grade trading
                  <br />
                  infrastructure
                </h2>
              </div>

              {/* Row 2: 4 columns */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[24px]">
                {[
                  {
                    iconSrc: "/assets/ion_flash-outline.svg",
                    title: "Lightning Fast",
                    desc: "Seamless order execution with optimized routing across all major exchanges and liquidity pools.",
                  },
                  {
                    iconSrc: "/assets/hugeicons_blockchain-02.svg",
                    title: "65+ Blockchains",
                    desc: "Trade assets across Ethereum, Solana, Bitcoin, and 60+ other networks in one interface.",
                  },
                  {
                    iconSrc: "/assets/system-uicons_graph-bar.svg",
                    title: "Deep Liquidity",
                    desc: "Aggregated liquidity from 100+ sources ensures minimal slippage and reduced fees.",
                  },
                  { 
                    iconSrc: "/assets/marketeq_secure.svg",
                    title: "Decentralized",
                    desc: "Your keys, your crypto. Trade directly from your wallet with no intermediaries. ",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center"
                  >

                  {/* Icon container */}
                  <div
                    className="flex items-center justify-center mb-[18px]"
                    style={{
                      ...iconBaseStyle,
                      ...(item.iconStyle ?? {
                        borderRadius: "12.917px",
                        background:
                          "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
                      }),
                    }}
                  >
                    <img src={item.iconSrc} alt="" className="w-full h-full object-contain" />
                  </div>


                    {/* Title */}
                    <h3
                      className="text-white mb-[12px]"
                      style={{
                        fontFamily: '"Gramatika Trial", sans-serif',
                        fontSize: "24px",
                        fontStyle: "normal",
                        fontWeight: 500,
                        lineHeight: "25.8px",
                        textAlign: "center",
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-white max-w-[260px]"
                      style={{
                        fontFamily: "ABeeZee, sans-serif",
                        fontSize: "15px",
                        fontStyle: "normal",
                        fontWeight: 400,
                        lineHeight: "24px",
                        letterSpacing: "0.169px",
                        textAlign: "center",
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

            </div>
        </section>
      </div>

      {/* Section Execution Flow */}
      <div className="w-full" style={{ background: "#151A23" }}>
        <section className="w-full flex justify-center py-[60px]">
            {/* Card */}
            <div
              className="w-full max-w-[1276px] h-auto rounded-[16px] px-[60px] py-[48px] flex flex-col"
              style={{
                background: "#161B26",
                filter:
                  "drop-shadow(0 9px 25.5px rgba(0, 0, 0, 0.50)) drop-shadow(-6px -7px 42px rgba(75, 84, 98, 0.25))",
              }}
            >
              {/* Row 1: Title */}
              <div className="w-full flex justify-center mb-[40px]">
                <h2
                  className="text-white text-center"
                  style={{
                    fontFamily: '"Gramatika Trial", sans-serif',
                    fontSize: "48px",
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "54px",
                  }}
                >
                  Execution Flow
                </h2>
              </div>

              {/* Row 2: columns + connectors */}
              <div className="relative w-full">
                {/* ===== Desktop connectors (lg+) + dots (custom positions) ===== */}
                <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
                  {(() => {
                    const CONNECTOR_W = 214;
                    const CONNECTOR_H = 21;

                    const DOT_SIZE = 10;
                    const DOT_GAP = 6;

                    // Conectores entre columnas (centros): 25%, 50%, 75%
                    const connectors = [
                      { mid: 25, top: 50, src: "/assets/Vector5.svg" }, // 1-2 (up)
                      { mid: 50, top: 20, src: "/assets/Vector4.svg" }, // 2-3 (down)
                      { mid: 75, top: 50, src: "/assets/Vector5.svg" }, // 3-4 (up)
                    ];

                    const connectorStyle = (mid, top) => ({
                      position: "absolute",
                      left: `calc(${mid}% - ${CONNECTOR_W / 2}px)`,
                      top: `${top}px`,
                      width: `${CONNECTOR_W}px`,
                      height: `${CONNECTOR_H}px`,
                    });

                    const dotStyle = ({ mid, top, at = 1, where = "above" }) => {
                      // at: 0..1 (porcentaje del ancho del conector)
                      const x = CONNECTOR_W * at - DOT_SIZE / 2;

                      const y =
                        where === "above"
                          ? top - DOT_SIZE - DOT_GAP
                          : top + CONNECTOR_H + DOT_GAP;

                      return {
                        position: "absolute",
                        left: `calc(${mid}% - ${CONNECTOR_W / 2}px + ${x}px)`,
                        top: `${y}px`,
                        width: `${DOT_SIZE}px`,
                        height: `${DOT_SIZE}px`,
                        borderRadius: "9999px",
                        background: "#373D48",
                      };
                    };

                    // Dots positions:
                    // 1) abajo del 1er conector @25%
                    // 2) arriba del 1er conector @75%
                    // 3) abajo del 2do conector @50%
                    // 4) arriba al final del 2do conector @100%
                    // 5) arriba del 3er conector al final @100%
                    const dots = [
                      { c: 0, where: "below", at: 0.25 },
                      { c: 0, where: "above", at: 0.75 },

                      { c: 1, where: "below", at: 0.5 },
                      { c: 1, where: "above", at: 0.9 },

                      { c: 2, where: "above", at: 0.9 },
                    ];

                    return (
                      <>
                        {/* Connectors */}
                        {connectors.map((c, i) => (
                          <img key={i} src={c.src} alt="" style={connectorStyle(c.mid, c.top)} />
                        ))}

                        {/* Dots */}
                        {dots.map((d, i) => {
                          const c = connectors[d.c];
                          return <span key={i} style={dotStyle({ mid: c.mid, top: c.top, at: d.at, where: d.where })} />;
                        })}
                      </>
                    );
                  })()}
                </div>

                {/* ===== Tablet connector (md only) ===== */}
                <div className="pointer-events-none absolute inset-0 z-0 hidden md:block lg:hidden">
                  <img
                    src="/assets/Vector6.png"
                    alt=""
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "34px", // puedes ajustar si el PNG debe bajar/subir
                      transform: "translate(-50%, 0) rotate(3.259deg)",
                      width: "169.876px",
                      height: "364.182px",
                      opacity: 1,
                    }}
                  />
                </div>
                {/* ===== Mobile dots (sm only) ===== */}
                <div className="pointer-events-none absolute inset-0 z-0 lg:hidden">
                  {[
                    { left: "12%", top: "26px" },
                    { left: "78%", top: "54px" },
                    { left: "34%", top: "210px" },
                    { left: "86%", top: "320px" },
                  ].map((p, i) => (
                    <span
                      key={i}
                      className="absolute"
                      style={{
                        left: p.left,
                        top: p.top,
                        width: "10px",
                        height: "10px",
                        borderRadius: "9999px",
                        background: "#373D48",
                      }}
                    />
                  ))}
                </div>

                {/* Cards grid */}
                <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[24px]">
                  {[
                    {
                      iconSrc: "/assets/icons8_bank-card.svg",
                      title: "Connect",
                      desc: "Connect to the dApp using your web3 supported wallets such as Metamask or Rabby etc.",
                      iconStyle: {
                        borderRadius: "137px",
                        background:
                          "linear-gradient(149deg, #00C2DC 3.34%, #007E97 102.38%)",
                      },
                    },
                    {
                      iconSrc: "/assets/iconamoon_send.svg",
                      title: "Swap Quote",
                      desc: "Determine the tokens and amount you want to swap and receive your output quote.",
                      iconStyle: {
                        borderRadius: "137px",
                        background:
                          "linear-gradient(149deg, #18CA70 3.34%, #00984C 102.38%)",
                      },
                    },
                    {
                      iconSrc: "/assets/ic_outline-local-offer.svg",
                      title: "Get Best Offer",
                      desc: "Verify the details of the transaction and confirm its accuracy.",
                      iconStyle: {
                        borderRadius: "137px",
                        background:
                          "linear-gradient(149deg, #FF783C 3.34%, #FF4F1E 102.38%)",
                      },
                    },
                    {
                      iconSrc: "/assets/line-md_bell-loop.svg",
                      title: "Confirm and Enjoy",
                      desc: "Confirm the swap transaction and enjoy the satisfaction of obtaining the best output.",
                      iconStyle: {
                        borderRadius: "137px",
                        background:
                          "linear-gradient(149deg, #3A8FEF 3.34%, #005FDE 102.38%)",
                      },
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center">
                      {/* Icon container */}
                      <div
                        className="flex items-center justify-center mb-[18px]"
                        style={{
                          ...iconBaseStyle,
                          ...(item.iconStyle ?? {
                            borderRadius: "12.917px",
                            background:
                              "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
                          }),
                        }}
                      >
                        <img src={item.iconSrc} alt="" className="w-full h-full object-contain" />
                      </div>

                      <h3
                        className="text-white mb-[12px]"
                        style={{
                          fontFamily: '"Gramatika Trial", sans-serif',
                          fontSize: "24px",
                          fontWeight: 500,
                          lineHeight: "25.8px",
                          textAlign: "center",
                        }}
                      >
                        {item.title}
                      </h3>

                      <p
                        className="text-white max-w-[260px]"
                        style={{
                          fontFamily: "ABeeZee, sans-serif",
                          fontSize: "15px",
                          fontWeight: 400,
                          lineHeight: "24px",
                          letterSpacing: "0.169px",
                          textAlign: "center",
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
        </section>
      </div>
    </div>
  );
}
