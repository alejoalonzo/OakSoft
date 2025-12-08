"use client";

import React, { useState } from "react";
import { fmt } from "../utils/formatting";
import { validateAddressForLoan } from "../utils/addressValidation";

export default function ConfirmLoanModal({ open, onClose, loan, summary }) {
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");

  if (!open) return null;

  const hasSummary = !!summary;

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);

    const result = validateAddressForLoan(
      value,
      summary?.borrowCode,
      summary?.borrowNetwork
    );

    setAddressError(result.valid ? "" : result.error);
  };

  const isAddressValid = !!address && !addressError;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full text-gray-900 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">Confirm your loan</h2>

        {hasSummary ? (
          <>
            {/* Top collateral -> loan */}
            <div className="bg-gray-100 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500">
                  Your collateral
                </div>
                <div className="text-lg font-bold">
                  {fmt(summary.collateralAmount, 6)} {summary.collateralCode}
                </div>
              </div>

              <div className="hidden sm:block text-2xl">→</div>

              <div>
                <div className="text-xs font-semibold text-gray-500">
                  Your loan
                </div>
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

            {/* Numeric details */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <div className="text-gray-500 text-xs">Loan-to-Value</div>
                <div className="font-semibold">{summary.ltv}%</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">APR</div>
                <div className="font-semibold">
                  {fmt(summary.apr, 2)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Monthly interest</div>
                <div className="font-semibold">
                  {summary.monthlyInterest
                    ? `${fmt(summary.monthlyInterest, 6)} ${
                        summary.borrowCode
                      }`
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Fee (1 month)</div>
                <div className="font-semibold">
                  {summary.fee
                    ? `${fmt(summary.fee, 6)} ${summary.borrowCode}`
                    : "-"}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 text-xs">
                  Liquidation price
                </div>
                <div className="font-semibold">
                  {summary.liquidationPrice
                    ? fmt(summary.liquidationPrice, 2)
                    : "-"}
                </div>
              </div>
            </div>

            {/* Address input with validation (layer 1) */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Payout address
              </label>
              <p className="text-xs text-gray-500 mb-2">
                We will send{" "}
                <span className="font-semibold">{summary.borrowCode}</span>{" "}
                {summary.borrowNetwork && (
                  <>
                    on{" "}
                    <span className="font-semibold">
                      {summary.borrowNetwork}
                    </span>{" "}
                  </>
                )}
                to this address.
              </p>
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="Wallet address"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {addressError && (
                <p className="mt-1 text-xs text-red-500">{addressError}</p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 mb-4">
            Loading loan details...
          </p>
        )}

        {/* Debug JSON (optional) */}
        {loan && (
          <details className="mt-3 mb-4">
            <summary className="text-xs text-gray-500 cursor-pointer">
              Show raw loan JSON (debug)
            </summary>
            <pre className="text-[10px] bg-gray-100 p-3 rounded-md overflow-x-auto max-h-40 mt-2">
              {JSON.stringify(loan, null, 2)}
            </pre>
          </details>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            className="px-4 py-2 text-sm rounded-lg border border-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60"
            disabled={!isAddressValid}
            onClick={() => {
              if (!isAddressValid) return;
              console.log("Address OK (layer 1):", address);
              // aquí luego enchufamos onConfirm(address) para la capa 2
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
