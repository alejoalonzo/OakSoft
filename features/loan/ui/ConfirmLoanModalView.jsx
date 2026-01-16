"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { fmt } from "../utils/formatting";

export default function ConfirmLoanModalView({
  open,
  onClose,

  // Data
  summary,
  loanId,

  // Address input
  address,
  onAddressChange,

  // Validation state
  validating,
  remoteValid,
  addressError,

  // Top messages
  loadingFresh,
  freshError,
  submitError,
  flowError,

  // Flow state
  txId,
  confirmingOrPaying,
  isAddressValid,

  // Actions
  onConfirm,

  // Optional content (so the view stays UI-only)
  statusContent,

  // Icons (not used currently)
  collateralIcon,
  borrowIcon,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const hasSummary = !!summary;

  const duration =
    summary?.duration ??
    summary?.selectedDuration ??
    (summary?.lifetime != null
      ? Number(summary.lifetime) === 1
        ? "long"
        : "short"
      : null);

  const durationLabel =
    summary?.durationLabel ??
    (duration === "long" ? "Long term" : duration === "short" ? "Short term" : "-");

  const fmtCompact = (n) => {
    if (n == null || n === "") return "-";
    const num = Number(n);
    if (!Number.isFinite(num)) return String(n);
    return fmt(num, Math.abs(num) >= 1 ? 2 : 4);
  };

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{
        background: "rgba(0, 0, 0, 0.50)",
        backdropFilter: "blur(14.899999618530273px)",
        WebkitBackdropFilter: "blur(14.899999618530273px)", // Safari
      }}
    >
      <div
        className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full text-gray-900 shadow-2xl mx-4 sm:mx-0 max-w-[620px] sm:w-[620px] m:h-[836px] overflow-y-auto"
        style={{
          border: "1px solid rgba(255, 255, 255, 0.10)",
          background:
            "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
          backdropFilter: "blur(31.149999618530273px)",
          WebkitBackdropFilter: "blur(31.149999618530273px)", // Safari
        }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          disabled={confirmingOrPaying}
          className="absolute right-4 top-4 sm:right-6 sm:top-6 w-9 h-9 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg leading-none">×</span>
        </button>

        <h2 className="text-white text-2xl  mb-2">Confirm Your Loan</h2>

        {loadingFresh && (
          <p className="text-xs text-gray-500 mb-2">Refreshing loan status...</p>
        )}
        {freshError && <p className="text-xs text-red-500 mb-2">{freshError}</p>}

        {(submitError || flowError) && (
          <p className="text-xs text-red-500 mb-2">{submitError || flowError}</p>
        )}

        {!!txId && (
          <p className="text-xs text-green-700 mb-2">
            Collateral sent. Tx: <span className="font-mono">{txId}</span>
          </p>
        )}

        {hasSummary ? (
          <>
            <div className="bg-transparent rounded-xl mb-3 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              {/* ===== Loan + Collateral (display-only, widget look) ===== */}
              <div className="space-y-6 mb-4 w-full">
                {/* ===== Loan (first) ===== */}
                <div className="w-full">
                  <label className="block text-sm text-[#E6EDE4] mb-2 tracking-wide">
                    Loan
                  </label>

                  <div className="w-full flex flex-row items-stretch bg-[#161B26] border border-[#1F242F] rounded-xl overflow-hidden">
                    {/* Left: amount ONLY */}
                    <div className="flex-1 min-w-0 px-5 py-2 bg-transparent text-white font-normal text-lg flex items-center whitespace-nowrap truncate">
                      {fmt(summary.loanAmount, 2)}
                    </div>

                    {/* Right group (divider + info), kept at the far right */}
                    <div className="ml-auto flex items-stretch shrink-0">
                      <div className="w-px bg-[#1F242F]" />

                      {/* Right: icon + token + network label */}
                      <div className="basis-[180px] sm:basis-[280px] min-w-0 p-1">
                        <div className="h-full bg-[#323841] rounded-2xl px-4 py-2">
                          <div className="w-full flex items-center gap-3 select-none cursor-default">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                              {borrowIcon ? (
                                <img src={borrowIcon} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-nolmal">
                                  {(summary.borrowCode || "?").slice(0, 1)}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex items-center justify-end gap-2">
                              <div className="min-w-0 text-white font-normal leading-none truncate">
                                {summary.borrowCode}
                              </div>

                              <span className="inline-flex items-center rounded-md border border-white/10 bg-[#151A23] px-2 py-0.5 text-[11px] text-white/70 whitespace-nowrap">
                                {summary.borrowNetwork || "Network"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== Collateral (second) ===== */}
                <div className="w-full">
                  <label className="block text-sm text-[#E6EDE4] mb-2 tracking-wide">
                    Collateral
                  </label>

                  <div className="w-full flex flex-row items-stretch bg-[#161B26] border border-[#1F242F] rounded-xl overflow-hidden">
                    {/* Left: amount ONLY */}
                    <div className="flex-1 min-w-0 px-5 py-2 bg-transparent text-white font-normal text-lg flex items-center whitespace-nowrap truncate">
                      {fmt(summary.collateralAmount, 6)}
                    </div>

                    {/* Right group (divider + info), kept at the far right */}
                    <div className="ml-auto flex items-stretch shrink-0">
                      <div className="w-px bg-[#1F242F]" />

                      {/* Right: icon + token + network label */}
                      <div className="basis-[180px] sm:basis-[280px] min-w-0 p-1">
                        <div className="h-full bg-[#323841] rounded-2xl px-4 py-2">
                          <div className="w-full flex items-center gap-3 select-none cursor-default">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                              {collateralIcon ? (
                                <img src={collateralIcon} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-normal">
                                  {(summary.collateralCode || "?").slice(0, 1)}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex items-center justify-end gap-2">
                              <div className="min-w-0 text-white font-normal leading-none truncate">
                                {summary.collateralCode}
                              </div>

                              <span className="inline-flex items-center rounded-md border border-white/10 bg-[#151A23] px-2 py-0.5 text-[11px] text-white/70 whitespace-nowrap">
                                {summary.collateralNetwork || "Network"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            {/* informational divider */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-6 sm:gap-x-10 text-sm mb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-gray-500 text-xs whitespace-nowrap">Loan-to-Value</div>
                <div className="text-white font-normal text-right">{summary.ltv}%</div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-gray-500 text-xs whitespace-nowrap">Monthly interest</div>
                <div className="text-white font-normal text-right">
                  {summary.monthlyInterest ? `${fmtCompact(summary.monthlyInterest)} ${summary.borrowCode}` : "-"}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-gray-500 text-xs whitespace-nowrap">APR</div>
                <div className="text-white font-normal text-right">{fmt(summary.apr, 2)}%</div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-gray-500 text-xs whitespace-nowrap">Fee (1 month)</div>
                <div className="text-white font-normal text-right">
                  {summary.fee ? `${fmtCompact(summary.fee)} ${summary.borrowCode}` : "-"}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-gray-500 text-xs whitespace-nowrap">Duration</div>
                <div className="text-white font-normal text-right">{durationLabel}</div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-gray-500 text-xs whitespace-nowrap">Liquidation price</div>
                <div className="text-white font-normal text-right">
                  {summary.liquidationPrice ? fmt(summary.liquidationPrice, 2) : "-"}
                </div>
              </div>
            </div>

            <div
              className="w-full mb-4"
              style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.10)" }}
            />

            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-normal text-[#E6EDE4]">
                  Your {summary.borrowCode} payout address
                </label>

                <div className="relative group">
                  <button
                    type="button"
                    aria-label="Payout address info"
                    className="w-6 h-6 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 text-xs leading-none hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    i
                  </button>

                  <div
                    className="pointer-events-none absolute left-0 top-full mt-2 w-[280px] rounded-xl border border-white/10 bg-[#0F1420]/95 px-3 py-2 text-xs text-white shadow-2xl opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 z-10"
                  >
                    We will send <span className="font-semibold">{summary.borrowCode}</span>{" "}
                    {summary.borrowNetwork ? (
                      <>
                        on <span className="font-semibold">{summary.borrowNetwork}</span>{" "}
                      </>
                    ) : null}
                    to this address.
                  </div>
                </div>
              </div>

              <input
                type="text"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="Wallet address"
                className="w-full px-4 py-3 rounded-xl text-sm bg-[#161B26] text-white placeholder-white/50 caret-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ border: "1.174px solid #1F242F" }}
              />

              <div className="mt-1 flex items-center justify-between">
                <div>
                  {validating && (
                    <p className="text-xs text-gray-500">Validating address...</p>
                  )}
                  {!validating && addressError && (
                    <p className="text-xs text-red-500">{addressError}</p>
                  )}
                </div>

                {!validating && remoteValid === true && (
                  <div className="flex items-center gap-1 text-[#95E100] text-xs font-semibold">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-transparent border border-[#95E100]">
                      ✓
                    </span>
                    Valid
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-white mb-4">Loading loan details...</p>
        )}

        <div className="mt-4">
          {!txId ? (
            <div className="w-full">
              <button
                className="w-full px-4 py-3 text-sm rounded-xl text-[#0B0F16] font-semibold disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ background: "#95E100" }}
                disabled={!isAddressValid || !loanId || confirmingOrPaying}
                onClick={onConfirm}
              >
                {confirmingOrPaying ? "Opening wallet..." : "Confirm"}
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-sm font-semibold">Processing deposit</div>
              <div className="text-xs text-gray-500 mt-1">
                Transaction sent: <span className="font-mono">{txId}</span>
              </div>

              {/* This is injected from the container to keep the view UI-only */}
              {statusContent ? <div className="mt-2">{statusContent}</div> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
