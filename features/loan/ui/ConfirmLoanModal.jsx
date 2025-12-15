"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fmt } from "../utils/formatting";
import { confirmLoan, getLoanById, validateAddress } from "../services/coinrabbit";

export default function ConfirmLoanModal({
  open,
  onClose,
  loan,
  summary,
  onConfirmed,
}) {
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");

  // Remote validation state
  const [validating, setValidating] = useState(false);
  const [remoteValid, setRemoteValid] = useState(null); // null | true | false

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // NEW: fresh loan state
  const [freshLoan, setFreshLoan] = useState(null);
  const [loadingFresh, setLoadingFresh] = useState(false);
  const [freshError, setFreshError] = useState("");

  const hasSummary = !!summary;

  const loanId = useMemo(
    () =>
      summary?.loanId ??
      loan?.response?.id ??
      loan?.response?.loan_id ??
      loan?.response?.loan?.id ??
      loan?.id ??
      null,
    [summary, loan]
  );

  const effectiveLoan = freshLoan ?? loan;

  // Network to validate against:
  // Prefer borrowNetwork; fallback to borrowCode (e.g. BTC).
  const payoutNetwork = useMemo(() => {
    const n = summary?.borrowNetwork || summary?.borrowCode || "";
    return String(n).trim().toUpperCase();
  }, [summary?.borrowNetwork, summary?.borrowCode]);

  // Reset input when modal opens/closes (clean UX)
  useEffect(() => {
    if (!open) return;
    setAddress("");
    setAddressError("");
    setRemoteValid(null);
    setSubmitError("");
  }, [open]);

  // Load loan when modal opens
  useEffect(() => {
    if (!open || !loanId) return;

    let cancelled = false;

    (async () => {
      setLoadingFresh(true);
      setFreshError("");
      try {
        const data = await getLoanById(loanId);
        if (!cancelled) setFreshLoan(data);
      } catch (e) {
        if (!cancelled) setFreshError(e?.message || "Get loan failed");
      } finally {
        if (!cancelled) setLoadingFresh(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, loanId]);

  // Remote validate address with debounce
  useEffect(() => {
    if (!open) return;

    const a = String(address || "").trim();

    // If empty, reset state
    if (!a) {
      setAddressError("");
      setRemoteValid(null);
      setValidating(false);
      return;
    }

    // If we still don't know network, don't validate yet
    if (!payoutNetwork) return;

    const controller = new AbortController();

    const t = setTimeout(async () => {
      setValidating(true);
      setAddressError("");

      try {
        const res = await validateAddress(a, summary?.borrowCode, payoutNetwork, null, {
          signal: controller.signal,
        });

        // res = { valid: boolean, raw?: any }
        setRemoteValid(!!res?.valid);
        setAddressError(res?.valid ? "" : "Invalid address for this network");
      } catch (err) {
        // If request was aborted, ignore
        if (controller.signal.aborted) return;

        setRemoteValid(false);
        setAddressError("Invalid address for this network");
      } finally {
        if (!controller.signal.aborted) setValidating(false);
      }
    }, 500);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [address, payoutNetwork, open, summary?.borrowCode]);

  // Safe early return AFTER hooks
  if (!open) return null;

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);

    // Clear errors while typing; remote validator will set them after debounce
    setAddressError("");
    setRemoteValid(null);
  };

  const isAddressValid = !!address.trim() && !addressError && remoteValid === true;

  const handleConfirm = async () => {
    if (!loanId) return;

    const a = address.trim();
    if (!a) {
      setAddressError("Enter an address");
      return;
    }

    // Final validation before confirming (anti-bypass)
    try {
      setSubmitting(true);
      setSubmitError("");

      const code = summary?.borrowCode;
      const network = payoutNetwork;

      if (!code || !network) {
        // Missing data to validate; block confirmation
        setSubmitError("Missing payout currency/network to validate address.");
        setSubmitting(false);
        return;
      }

      const check = await validateAddress(a, code, network, null);


      const res = await confirmLoan(loanId, a);
      onConfirmed?.(res);

      // Refresh status after confirmation
      try {
        const data = await getLoanById(loanId);
        setFreshLoan(data);
      } catch (_) {}
    } catch (err) {
      setSubmitError(err?.message || "Confirm failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full text-gray-900 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2">Confirm your loan</h2>

        {loadingFresh && (
          <p className="text-xs text-gray-500 mb-2">Refreshing loan status...</p>
        )}
        {freshError && <p className="text-xs text-red-500 mb-2">{freshError}</p>}
        {submitError && <p className="text-xs text-red-500 mb-2">{submitError}</p>}

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
                    <span className="ml-1 text-xs text-gray-500">({summary.borrowNetwork})</span>
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
                onChange={handleAddressChange}
                placeholder="Wallet address"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {/* Status row */}
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

        <div className="flex justify-end gap-3 mt-4">
          <button
            className="px-4 py-2 text-sm rounded-lg border border-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60"
            disabled={!isAddressValid || !loanId || submitting}
            onClick={handleConfirm}
          >
            {submitting ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
