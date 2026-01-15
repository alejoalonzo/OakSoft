"use client";

import { useState } from "react";
import { fmt } from "../features/loan/utils/formatting";
import { optValue, optLabel, isSameAsCollateral, findByValue, getTokenLogo } from "../features/loan/utils/token";
import useCurrencies from "../features/loan/hooks/useCurrencies";
import useEstimate from "../features/loan/hooks/useEstimate";
import useCreateLoan from "@/features/loan/hooks/useCreateLoan";
import TokenSelect from "../features/loan/ui/tokenSelect.jsx";
import ConfirmLoanModal from "../features/loan/ui/ConfirmLoanModal.jsx"; 

export default function LoanWidget() {
  //  UI-only state
  const [selectedLTV, setSelectedLTV] = useState("65");
  const [selectedDuration, setSelectedDuration] = useState("long");
  const [amount, setAmount] = useState(""); // Collateral amount (user input)
  const [showConfirm, setShowConfirm] = useState(false);

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
    selectedDuration,
    estimate,
  });

  // Modal "Get Loan"
  const handleGetLoanClick = async () => {
    try {
      await handleCreate();   // only wait for creation
      setShowConfirm(true);   // only open modal if successful
    } catch (e) {
      console.error("Failed to create loan:", e);
      // Check if it's an authentication error
      if (e.message?.includes("No logged in user") || e.message?.includes("401")) {
        alert("Please log in to create a loan");
        window.location.href = "/login";
      } else {
        alert(e.message || "Failed to create loan. Please try again.");
      }
    }
  };

  // ===== Summary data for the confirmation modal =====
  const confirmSummary =
    estimate && selectedCollateral && selectedBorrow
      ? {
          collateralAmount: Number(amount || 0),
          collateralCode: selectedCollateral.code,
          loanAmount: Number(estimate.amount_to ?? 0),
          borrowCode: selectedBorrow.code,
          borrowNetwork: selectedBorrow.network,
          ltv: Number(selectedLTV),
          apr:
            selectedDuration === "long"
              ? Number(
                  estimate.fixed_apr_unlimited_loan ??
                    estimate.interest_percent ??
                    0
                )
              : Number(
                  estimate.fixed_apr_fixed_loan ??
                    estimate.interest_percent ??
                    0
                ),
          monthlyInterest: Number(
            estimate.interest_amounts?.month ?? 0
          ),
          fee: Number(estimate.one_month_fee ?? 0),
          liquidationPrice: Number(estimate.down_limit ?? 0),
        }
      : null;


  return (
    <div 
      className="px-4 py-10 md:p-10"
      style={{
        borderRadius: '12.917px',
        border: '2.348px solid rgba(255, 255, 255, 0.10)',
        background: 'linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)',
        boxShadow: '0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(20.138256072998047px)'
      }}
    >
      <div className="space-y-8">
        <h3 
          className="font-medium tracking-tight text-white text-base sm:text-[28px]"
          style={{
            fontFamily: '"Gramatika Trial", "Helvetica", "Arial", sans-serif',
            fontStyle: 'normal',
            lineHeight: 'normal'
          }}
        >
          Loan Calculator
        </h3>

        <div className="space-y-6">
          {/* ===== Collateral (with Amount connected) ===== */}
          <div>
            <label className="block text-sm  text-[#E6EDE4] mb-3 tracking-wide">Collateral</label>
            <div className="flex flex-col sm:flex-row bg-[#161B26] border border-gray-600/60 rounded-xl overflow-visible focus-within:border-[#95E100] transition-all duration-300 hover:border-gray-500 gap-2 sm:gap-0">
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
            <label className="block text-sm  text-[#E6EDE4] mb-3 tracking-wide">Loan</label>
            <div className="flex flex-col sm:flex-row bg-[#161B26] border border-gray-600/60 rounded-xl overflow-visible gap-2 sm:gap-0">
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
          {/* ===== LTV Selection ===== */}
          <div>
                <label className="block text-sm  text-[#E6EDE4] mb-3 tracking-wide">
                  LTV Ratio (Loan-to-Value)
                </label>
                <div className="bg-transparent rounded-xl ">
                  <div className="grid grid-cols-4 gap-3">
                  {["50", "65", "80", "90"].map((ltv) => (
                    <button
                    key={ltv}
                    onClick={() => setSelectedLTV(ltv)}
                    className={`py-4 px-4 rounded-lg text-sm border border-gray-600/60 transition-all duration-300 transform hover:scale-105 ${
                      selectedLTV === ltv
                      ? "bg-[#1978ED] text-white"
                      : "bg-[#161B26] text-gray-300 hover:bg-[#1978ED]/80"
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
            <label className="block text-sm text-[#E6EDE4] mb-3 tracking-wide">Choose APR</label>

            <div className="bg-transparent rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedDuration("long")}
                  className={`p-5 rounded-xl font-medium text-sm transition-all duration-300 text-left transform hover:scale-105 ${
                    selectedDuration === "long"
                      ? "border border-[#95E100] bg-gray-600/40 text-white"
                      : "border border-gray-500/60 bg-[#161B26] text-gray-300 hover:border-[#95E100]/60 hover:text-white hover:bg-[#1B2230]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="mb-1">Long Term</div>
                      <div className="text-xs opacity-80">Unlimited time</div>
                      {estimate && (
                        <div className="text-xs opacity-70 mt-1">
                          ~{fmt(estimate.interest_amounts?.year ?? 0, 2)} {selectedBorrow?.code || ""}/year
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="mb-1">APR</div>
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
                      ? "border border-[#95E100] bg-gray-600/40 text-white"
                      : "border border-gray-500/60 bg-[#161B26] text-gray-300 hover:border-[#95E100]/60 hover:text-white hover:bg-[#1B2230]"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="mb-1">Short Term</div>
                      <div className="text-xs opacity-80">30 days</div>
                      {estimate && (
                        <div className="text-xs opacity-70 mt-1">
                          ~{fmt(estimate.interest_amounts?.month ?? 0, 2)} {selectedBorrow?.code || ""}/month
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="mb-1">APR</div>
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
          onClick={handleGetLoanClick}
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
      {/* Confirmation Modal */}
      <ConfirmLoanModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        loan={lastLoan}
        summary={confirmSummary}
      />
    </div>
  );
}
