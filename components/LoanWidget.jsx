"use client";

import { useState, useEffect, useRef } from "react";

export default function LoanWidget() {
  // ===== State =====
  const [selectedLTV, setSelectedLTV] = useState("65");
  const [selectedDuration, setSelectedDuration] = useState("long");

  const [depositList, setDepositList] = useState([]);
  const [selectedCollateral, setSelectedCollateral] = useState(null);

  const [borrowList, setBorrowList] = useState([]);
  const [selectedBorrow, setSelectedBorrow] = useState(null);

  const [currencies, setCurrencies] = useState([]);
  const [loadingCur, setLoadingCur] = useState(false);
  const [curErr, setCurErr] = useState(null);

  const [amount, setAmount] = useState(""); // Collateral amount (user input)

  const [estimate, setEstimate] = useState(null);
  const [estLoading, setEstLoading] = useState(false);
  const [estErr, setEstErr] = useState(null);

  // Rate-limit backoff
  const last429Ref = useRef(0);

  // ===== Helpers =====
  const optValue = (c) => `${c.code}|${c.network}`;
  const optLabel = (c) => `${c.code} (${c.network}) — ${c.name || c.code}`;

  const findByValue = (v, list) => {
    const [code, network] = String(v).split("|");
    return (list || []).find((c) => c.code === code && c.network === network) || null;
  };

  const getTokenLogo = (list, code, network) => {
    const token = (list || []).find((c) => c.code === code && c.network === network);
    return token?.logo_url || `https://via.placeholder.com/32/6B7280/FFFFFF?text=${(code || "?").charAt(0)}`;
  };

  const fmt = (n, p = 2) => {
    if (n == null || n === "") return "";
    const num = Number(n);
    return Number.isFinite(num) ? num.toFixed(p) : String(n);
  };

  const sortBy = (list, prioKey) =>
    (list || [])
      .filter((c) => c?.code && c?.network)
      .sort(
        (a, b) =>
          ((a?.[prioKey] ?? 999) - (b?.[prioKey] ?? 999)) ||
          String(a.code).localeCompare(String(b.code))
      );

  const NET_ORDER = ["ETH", "ARBITRUM", "BASE", "BSC", "AVAXC", "MATIC", "TRX", "SOL"];

  function receiveNetworksOf(code, all) {
    return [
      ...new Set(
        (all || [])
          .filter((c) => c.code === code && c.is_loan_receive_enabled === true)
          .map((c) => c.network)
      ),
    ];
  }

  function prioritize(nets, prefer) {
    const scored = nets.map((n) => ({ n, s: NET_ORDER.indexOf(n) }));
    scored.sort(
      (a, b) =>
        (a.n === prefer ? -1 : b.n === prefer ? 1 : (a.s < 0) - (b.s < 0) || a.s - b.s)
    );
    return scored.map((x) => x.n);
  }

  // ===== Load currencies (deposit + borrow) =====
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingCur(true);
      try {
        const r = await fetch("/api/coinrabbit/currencies?is_enabled=null", { cache: "no-store" });
        const j = await r.json();
        if (cancel) return;

        const arr = Array.isArray(j?.response) ? j.response : [];

        // Collateral: only deposit-enabled
        const byDeposit = sortBy(arr.filter((c) => c?.is_loan_deposit_enabled === true), "loan_deposit_priority");

        // Loan (receive): only receive-enabled (clave para evitar 500 por pares imposibles)
        const byBorrow = sortBy(arr.filter((c) => c?.is_loan_receive_enabled === true), "loan_borrow_priority");

        setCurrencies(arr);
        setDepositList(byDeposit);
        setBorrowList(byBorrow);

        if (!selectedCollateral && byDeposit.length) setSelectedCollateral(byDeposit[0]);
        if (!selectedBorrow && byBorrow.length) setSelectedBorrow(byBorrow[0]);
      } catch (e) {
        if (!cancel) setCurErr(e.message || "Error");
      } finally {
        if (!cancel) setLoadingCur(false);
      }
    })();
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Estimate with debounce + fallback =====
  async function runEstimateWithFallback(ctrl) {
    // simple rate-limit backoff
    if (Date.now() - last429Ref.current < 60_000) {
      setEstErr("Rate limit. Try again in ~1 minute.");
      return;
    }

    setEstLoading(true);
    setEstErr(null);
    setEstimate(null);

    const from = { code: selectedCollateral.code, network: selectedCollateral.network };
    const to = { code: selectedBorrow.code, network: selectedBorrow.network };
    const ltvP = Number(selectedLTV) / 100;

    // redes válidas del token (según receive-enabled)
    const netsAll = receiveNetworksOf(to.code, currencies);
    const ordered = prioritize(netsAll, to.network);
    const netsTry = ordered.length ? ordered.slice(0, 3) : [to.network]; // máximo 3 intentos

    for (const net of netsTry) {
      const qs = new URLSearchParams({
        from_code: from.code,
        from_network: from.network,
        to_code: to.code,
        to_network: net,
        amount: String(amount),
        ltv_percent: String(ltvP),
        exchange: "direct",
      });

      const r = await fetch(`/api/coinrabbit/estimate?${qs}`, { signal: ctrl.signal, cache: "no-store" });
      let j;
      try {
        j = await r.json();
      } catch {
        j = {};
      }

      if (ctrl.signal.aborted) return;

      if (r.status === 429) {
        last429Ref.current = Date.now();
        setEstErr("Rate limit. Try again in ~1 minute.");
        break;
      }

      if (r.ok && j?.result) {
        // si cambió la red, sincroniza el selector
        if (net !== selectedBorrow.network) {
          const fixed = (borrowList || []).find((c) => c.code === to.code && c.network === net);
          if (fixed) setSelectedBorrow(fixed);
        }
        setEstimate(j.response || null);
        setEstErr(null);
        setEstLoading(false);
        return;
      }

      const msg = (j?.message || "").toLowerCase();
      const isPairErr = msg.includes("pair does not exists") || msg.includes("data for currency");
      if (!isPairErr) {
        setEstErr(j?.message || "Estimate failed");
        break;
      }
      // si es "pair not exists", continúa probando la siguiente red
    }

    if (!estimate) setEstErr(`No available network for ${to.code} with ${from.code}.`);
    setEstLoading(false);
  }

  useEffect(() => {
    if (!selectedCollateral || !selectedBorrow) return;
    if (!amount || Number(amount) <= 0) return;

    const ctrl = new AbortController();
    const t = setTimeout(() => runEstimateWithFallback(ctrl), 400); // debounce 400ms
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [selectedCollateral, selectedBorrow, amount, selectedLTV, currencies, borrowList]); // deps

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl border border-white/20 p-10 shadow-2xl backdrop-blur-sm">
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-white tracking-tight">Loan Calculator</h3>

        <div className="space-y-6">
          {/* ===== Collateral (con Amount conectado) ===== */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">Collateral</label>
            <div className="flex bg-gray-700/50 border border-gray-600/60 rounded-xl overflow-hidden focus-within:border-[#95E100] transition-all duration-300 hover:border-gray-500">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={selectedCollateral?.loan_deposit_default_amount || "0.00"}
                className="flex-1 px-5 py-4 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg font-medium [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
              <div className="border-l border-gray-600/60"></div>

              <div className="relative">
                <select
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={selectedCollateral ? optValue(selectedCollateral) : ""}
                  onChange={(e) => setSelectedCollateral(findByValue(e.target.value, depositList))}
                >
                  {loadingCur && <option className="bg-gray-700">Cargando…</option>}
                  {curErr && <option className="bg-gray-700">Error al cargar</option>}
                  {!loadingCur &&
                    !curErr &&
                    depositList.map((c) => (
                      <option key={optValue(c)} value={optValue(c)} className="bg-gray-700">
                        {optLabel(c)}
                      </option>
                    ))}
                </select>

                <div className="flex items-center px-4 py-3 cursor-pointer min-w-[220px] hover:bg-gray-600/20 transition-colors">
                  {selectedCollateral ? (
                    <>
                      <img
                        src={getTokenLogo(depositList, selectedCollateral.code, selectedCollateral.network)}
                        alt={selectedCollateral.code}
                        className="w-6 h-6 rounded-full mr-3"
                        onError={(e) => {
                          e.currentTarget.src = `https://via.placeholder.com/24/6B7280/FFFFFF?text=${selectedCollateral.code.charAt(0)}`;
                        }}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-white font-medium">{selectedCollateral.code}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-gray-600">
                          {selectedCollateral.network}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  ) : (
                    <span className="text-gray-400">Seleccionar token...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Loan token + resultado ===== */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">Loan</label>
            <div className="flex bg-gray-700/50 border border-gray-600/60 rounded-xl overflow-hidden">
              <div className="flex-1 px-5 py-4 bg-transparent text-white font-bold text-xl flex items-center">
                {estLoading
                  ? "(...)"
                  : estimate
                  ? `${fmt(estimate.amount_to, 2)} ${selectedBorrow?.code || ""}`
                  : "$2,450.00"}
              </div>
              <div className="border-l border-gray-600/60"></div>

              <div className="relative">
                <select
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={selectedBorrow ? optValue(selectedBorrow) : ""}
                  onChange={(e) => setSelectedBorrow(findByValue(e.target.value, borrowList))}
                >
                  {loadingCur && <option className="bg-gray-700">Cargando…</option>}
                  {curErr && <option className="bg-gray-700">Error al cargar</option>}
                  {!loadingCur &&
                    !curErr &&
                    borrowList.map((c) => (
                      <option key={optValue(c)} value={optValue(c)} className="bg-gray-700">
                        {optLabel(c)}
                      </option>
                    ))}
                </select>

                <div className="flex items-center px-4 py-3 cursor-pointer min-w-[220px] hover:bg-gray-600/20 transition-colors">
                  {selectedBorrow ? (
                    <>
                      <img
                        src={getTokenLogo(borrowList, selectedBorrow.code, selectedBorrow.network)}
                        alt={selectedBorrow.code}
                        className="w-6 h-6 rounded-full mr-3"
                        onError={(e) => {
                          e.currentTarget.src = `https://via.placeholder.com/24/6B7280/FFFFFF?text=${selectedBorrow.code.charAt(0)}`;
                        }}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-white font-medium">{selectedBorrow.code}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-gray-600">
                          {selectedBorrow.network}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  ) : (
                    <span className="text-gray-400">Seleccionar token...</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-1">
              Amount calculated based on LTV ratio and current market prices
            </p>
            {estErr && (
              <p className="text-xs text-red-400 mt-2 ml-1">
                {estErr}
              </p>
            )}
          </div>

          {/* ===== LTV ===== */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">
              LTV Ratio (Loan-to-Value)
            </label>
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/40">
              <div className="grid grid-cols-4 gap-3">
                {["50", "65", "80", "90"].map((ltv) => (
                  <button
                    key={ltv}
                    onClick={() => setSelectedLTV(ltv)}
                    className={`py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                      selectedLTV === ltv
                        ? "bg-[#95E100] text-gray-900"
                        : "bg-gray-600/60 text-gray-300 hover:bg-[#95E100]/80 hover:text-gray-900"
                    }`}
                  >
                    {ltv}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ===== APR desde estimate ===== */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">Choose APR</label>
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/40">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedDuration("long")}
                  className={`p-5 rounded-xl font-medium text-sm transition-all duration-300 text-left transform hover:scale-105 ${
                    selectedDuration === "long"
                      ? "border-2 border-[#95E100] bg-gray-600/40 text-white"
                      : "border-2 border-gray-500/60 bg-gray-600/30 text-gray-300 hover:border-[#95E100]/60 hover:text-white"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold mb-1">Long Term</div>
                      <div className="text-xs opacity-80">Unlimited time</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold mb-1">APR</div>
                      <div className="text-xs">
                        {estimate ? `${fmt(estimate.fixed_apr_unlimited_loan ?? estimate.interest_percent ?? 0, 2)}%` : "(...)"}
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedDuration("short")}
                  className={`p-5 rounded-xl font-medium text-sm transition-all duration-300 text-left transform hover:scale-105 ${
                    selectedDuration === "short"
                      ? "border-2 border-[#95E100] bg-gray-600/40 text-white"
                      : "border-2 border-gray-500/60 bg-gray-600/30 text-gray-300 hover:border-[#95E100]/60 hover:text-white"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold mb-1">Short Term</div>
                      <div className="text-xs opacity-80">30 days</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold mb-1">APR</div>
                      <div className="text-xs">
                        {estimate ? `${fmt(estimate.fixed_apr_fixed_loan ?? estimate.interest_percent ?? 0, 2)}%` : "(...)"}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Extras útiles de Estimate */}
            <div className="text-xs text-gray-400 space-x-4 mt-2">
              <span>Fee 1m: {estimate?.one_month_fee ?? "-"}</span>
              <span>Interest/mo: {estimate?.interest_amounts?.month ?? "-"}</span>
              <span>Liquidation: {estimate?.down_limit ? fmt(estimate.down_limit, 2) : "-"}</span>
            </div>
          </div>
        </div>

        {/* Botón final (UI) */}
        <button className="w-full bg-gradient-to-r from-[#95E100] to-[#95E100]/90 hover:from-[#95E100]/90 hover:to-[#95E100] text-gray-900 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105">
          Get Loan
        </button>
      </div>
    </div>
  );
}
