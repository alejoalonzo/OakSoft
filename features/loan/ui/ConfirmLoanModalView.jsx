"use client";

import React from "react";
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
}) {
  if (!open) return null;

  const hasSummary = !!summary;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full text-gray-900 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2">Confirm your loan</h2>

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
            <div className="bg-gray-100 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500">Your collateral</div>
                <div className="text-lg font-bold">
                  {fmt(summary.collateralAmount, 6)} {summary.collateralCode}
                </div>
              </div>

              <div className="hidden sm:block text-2xl">→</div>

              <div>
                <div className="text-xs font-semibold text-gray-500">Your loan</div>
                <div className="text-lg font-bold">
                  {fmt(summary.loanAmount, 2)} {summary.borrowCode}
                  {summary.borrowNetwork ? (
                    <span className="ml-1 text-xs text-gray-500">
                      ({summary.borrowNetwork})
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <div className="text-gray-500 text-xs">Loan-to-Value</div>
                <div className="font-semibold">{summary.ltv}%</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">APR</div>
                <div className="font-semibold">{fmt(summary.apr, 2)}%</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Monthly interest</div>
                <div className="font-semibold">
                  {summary.monthlyInterest
                    ? `${fmt(summary.monthlyInterest, 6)} ${summary.borrowCode}`
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Fee (1 month)</div>
                <div className="font-semibold">
                  {summary.fee ? `${fmt(summary.fee, 6)} ${summary.borrowCode}` : "-"}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 text-xs">Liquidation price</div>
                <div className="font-semibold">
                  {summary.liquidationPrice ? fmt(summary.liquidationPrice, 2) : "-"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Payout address
              </label>
              <p className="text-xs text-gray-500 mb-2">
                We will send <span className="font-semibold">{summary.borrowCode}</span>{" "}
                {summary.borrowNetwork ? (
                  <>
                    on <span className="font-semibold">{summary.borrowNetwork}</span>{" "}
                  </>
                ) : null}
                to this address.
              </p>

              <input
                type="text"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="Wallet address"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                      ✓
                    </span>
                    Valid
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 mb-4">Loading loan details...</p>
        )}

        <div className="mt-4">
          {!txId ? (
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm rounded-lg border border-gray-300"
                onClick={onClose}
                disabled={confirmingOrPaying}
              >
                Cancel
              </button>

              <button
                className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60"
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
}
