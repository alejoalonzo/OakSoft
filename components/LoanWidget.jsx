"use client";

import { useState } from "react";
import { fmt } from "../features/loan/utils/formatting";
import { optValue, optLabel, isSameAsCollateral, findByValue, getTokenLogo } from "../features/loan/utils/token";
import useCurrencies from "../features/loan/hooks/useCurrencies";
import useEstimate from "../features/loan/hooks/useEstimate";
import useCreateLoan from "@/features/loan/hooks/useCreateLoan";
import TokenSelect from "../features/loan/ui/tokenSelect.jsx";

export default function LoanWidget() {
  //  UI-only state
  const [selectedLTV, setSelectedLTV] = useState("65");
  const [selectedDuration, setSelectedDuration] = useState("long");
  const [amount, setAmount] = useState(""); // Collateral amount (user input)

  // ===== Load currencies (deposit + borrow) =====
   const {
    currencies,
    depositList,
    borrowList,
    selectedCollateral,
    setSelectedCollateral,
    selectedBorrow,
    setSelectedBorrow,
    loadingCur,
    curErr,
  } = useCurrencies();


  // ===== Estimate with debounce + fallback =====
  const { estimate, estLoading, estErr } = useEstimate({
    amount,
    selectedCollateral,
    selectedBorrow,
    selectedLTV,
    currencies,
    borrowList,
    setSelectedBorrow, // optional
  });

    // ===== Create loan hook =====
  const { handleCreate, creating, createErr, lastLoan } = useCreateLoan({
    amount,
    selectedCollateral,
    selectedBorrow,
    selectedLTV,
    estimate,
  });

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl border border-white/20 p-10 shadow-2xl backdrop-blur-sm">
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-white tracking-tight">Loan Calculator</h3>

        <div className="space-y-6">
          {/* ===== Collateral (with Amount connected) ===== */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">Collateral</label>
            <div className="flex flex-col sm:flex-row bg-gray-700/50 border border-gray-600/60 rounded-xl overflow-visible focus-within:border-[#95E100] transition-all duration-300 hover:border-gray-500 gap-2 sm:gap-0">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={selectedCollateral?.loan_deposit_default_amount || "0.00"}
                className="flex-1 min-w-0 px-5 py-4 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg font-medium [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
              <div className="border-gray-600/60 sm:border-l sm:border-t-0 border-t"></div>

              {/*  Right Block: fixed width on desktop, full on mobile */}
              <div className="px-3 py-2 w-full sm:flex-none sm:basis-[280px] min-w-0">
                <TokenSelect
                  list={depositList}
                  value={selectedCollateral}
                  onChange={setSelectedCollateral}
                  disabled={loadingCur || !!curErr}
                  placeholder="Seleccionar token…"
                  getIcon={(it) => getTokenLogo(depositList, it.code, it.network)}
                  className="w-full"   // the button fills the right block
                />
              </div>
            </div>
          </div>

          {/* ===== Loan token + result ===== */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">Loan</label>
            <div className="flex flex-col sm:flex-row bg-gray-700/50 border border-gray-600/60 rounded-xl overflow-visible gap-2 sm:gap-0">
              <div className="flex-1 min-w-0 px-5 py-4 bg-transparent text-white font-bold text-xl flex items-center">
                {estLoading ? "(...)" : estimate ? `${fmt(estimate.amount_to, 2)} ${selectedBorrow?.code || ""}` : "0"}
              </div>
              <div className="border-gray-600/60 sm:border-l sm:border-t-0 border-t"></div>

              {/*  Right Block: fixed width on desktop, full on mobile */}
              <div className="px-3 py-2 w-full sm:flex-none sm:basis-[280px] min-w-0">
                <TokenSelect
                  list={borrowList}
                  value={selectedBorrow}
                  onChange={setSelectedBorrow}
                  disabled={loadingCur || !!curErr}
                  placeholder="Seleccionar token…"
                  getIcon={(it) => getTokenLogo(borrowList, it.code, it.network)}
                  hideItem={(it) => isSameAsCollateral(it, selectedCollateral)}
                  className="w-full"   // the button fills the right block
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2 ml-1">
              Amount calculated based on LTV ratio and current market prices
            </p>
            {estErr && <p className="text-xs text-red-400 mt-2 ml-1">{estErr}</p>}
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

          {/* ===== APR from estimate ===== */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">Choose APR</label>
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Extras for Estimate */}
            <div className="text-xs text-gray-400 space-x-4 mt-2">
              <span>Fee 1m: {estimate?.one_month_fee ?? "-"}</span>
              <span>Interest/mo: {estimate?.interest_amounts?.month ?? "-"}</span>
              <span>Liquidation: {estimate?.down_limit ? fmt(estimate.down_limit, 2) : "-"}</span>
            </div>
          </div>
        </div>

        {/* Button Create (get loan) (UI) */}
        <button
          onClick={handleCreate}
          disabled={
            creating ||
            !amount ||
            Number(amount) <= 0 ||
            !selectedCollateral ||
            !selectedBorrow ||
            !estimate
          }
          className="w-full bg-gradient-to-r from-[#95E100] to-[#95E100]/90 hover:from-[#95E100]/90 hover:to-[#95E100] text-gray-900 font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {creating ? "Creating loan..." : "Get Loan"}
        </button>

        {createErr && (
          <p className="text-xs text-red-400 mt-2 ml-1">{createErr}</p>
        )}

      </div>
    </div>
  );
}
