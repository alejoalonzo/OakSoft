"use client";

import React, { useMemo, useState } from "react";
import ConfirmLoanModalView from "@/features/loan/ui/ConfirmLoanModalView";

export default function ConfirmLoanDevPreviewPage() {
  // Mock summary data (edit freely to test layouts)
  const summary = useMemo(
    () => ({
      loanId: "demo-loan-id",
      collateralAmount: 0.25,
      collateralCode: "ETH",
      loanAmount: 500,
      borrowCode: "USDC",
      borrowNetwork: "ARBITRUM",
      ltv: 65,
      apr: 12.5,
      monthlyInterest: 5.2,
      fee: 3.1,
      liquidationPrice: 1450,
    }),
    []
  );

  // UI states to simulate every scenario
  const [open, setOpen] = useState(true);
  const [address, setAddress] = useState("0x1234...abcd");

  const [validating, setValidating] = useState(false);
  const [remoteValid, setRemoteValid] = useState(true);
  const [addressError, setAddressError] = useState("");

  const [loadingFresh, setLoadingFresh] = useState(false);
  const [freshError, setFreshError] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [flowError, setFlowError] = useState("");

  const [confirmingOrPaying, setConfirmingOrPaying] = useState(false);
  const [txId, setTxId] = useState("");

  const isAddressValid =
    !!address.trim() && !addressError && remoteValid === true;

  const resetMessages = () => {
    // English comments only
    setAddressError("");
    setFreshError("");
    setSubmitError("");
    setFlowError("");
  };

  return (
    <div className="min-h-screen p-6 text-white">
      <h1 className="text-xl font-semibold mb-4">ConfirmLoanModal Preview</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center rounded-xl border border-white/10 bg-white/5 p-4">
        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => setOpen(true)}
        >
          Open modal
        </button>

        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => setOpen(false)}
        >
          Close modal
        </button>

        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => {
            setTxId("");
            setConfirmingOrPaying(false);
            resetMessages();
          }}
        >
          Reset state
        </button>

        <div className="w-full h-px bg-white/10 my-2" />

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={validating}
            onChange={(e) => setValidating(e.target.checked)}
          />
          validating
        </label>

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={remoteValid === true}
            onChange={(e) => setRemoteValid(e.target.checked)}
          />
          valid
        </label>

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={confirmingOrPaying}
            onChange={(e) => setConfirmingOrPaying(e.target.checked)}
          />
          confirmingOrPaying
        </label>

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={loadingFresh}
            onChange={(e) => setLoadingFresh(e.target.checked)}
          />
          loadingFresh
        </label>

        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => setTxId("0xDEMO_TX_123")}
        >
          Set txId
        </button>

        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => {
            setAddressError("Invalid address for network");
            setRemoteValid(false);
          }}
        >
          Set address error
        </button>

        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => setFreshError("Get loan failed")}
        >
          Set fresh error
        </button>

        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => setSubmitError("Confirm failed")}
        >
          Set submit error
        </button>

        <button
          className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
          onClick={() => setFlowError("Wallet rejected")}
        >
          Set flow error
        </button>
      </div>

      <ConfirmLoanModalView
        open={open}
        onClose={() => setOpen(false)}
        summary={summary}
        loanId={summary.loanId}
        address={address}
        onAddressChange={(v) => setAddress(v)}
        validating={validating}
        remoteValid={remoteValid}
        addressError={addressError}
        loadingFresh={loadingFresh}
        freshError={freshError}
        submitError={submitError}
        flowError={flowError}
        txId={txId}
        confirmingOrPaying={confirmingOrPaying}
        isAddressValid={isAddressValid}
        onConfirm={() => {
          // English comments only
          setConfirmingOrPaying(true);
          setTimeout(() => {
            setConfirmingOrPaying(false);
            setTxId("0xDEMO_TX_123");
          }, 600);
        }}
        statusContent={
          <div className="text-xs text-gray-600">
            {/* English comments only */}
            Status placeholder (replace with LoanStatusLabel in real flow)
          </div>
        }
      />
    </div>
  );
}
