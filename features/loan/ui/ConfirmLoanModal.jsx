"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getLoanById } from "../services/coinrabbit";
import { useConfirmAndPayCollateral } from "../hooks/useConfirmAndPayCollateral";
import { useValidateAddress } from "@/features/loan/hooks/useValidateAddress";
import { useRouter } from "next/navigation";
import LoanStatusLabel from "@/features/loan/ui/LoanStatusLabel";
import ConfirmLoanModalView from "./ConfirmLoanModalView";


export default function ConfirmLoanModal({ open, onClose, loan, summary, onConfirmed }) {
  const [address, setAddress] = useState("");

  const router = useRouter();
  const [startListen, setStartListen] = useState(false);
  
  const [submitError, setSubmitError] = useState("");

  // Fresh loan state
  const [freshLoan, setFreshLoan] = useState(null);
  const [loadingFresh, setLoadingFresh] = useState(false);
  const [freshError, setFreshError] = useState("");

  const [busyLabel, setBusyLabel] = useState("");

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
  const payoutNetwork = useMemo(() => {
    const n = summary?.borrowNetwork || summary?.borrowCode || "";
    return String(n).trim().toUpperCase();
  }, [summary?.borrowNetwork, summary?.borrowCode]);

  const {
  validating,
  valid: remoteValid,
  error: addressError,
} = useValidateAddress({
  address,
  code: summary?.borrowCode,
  network: payoutNetwork,
  enabled: open,
});


  // Hook that does: final validate -> confirm -> open wallet -> pay collateral
  const { run, loading: confirmingOrPaying, txId, error: flowError } =
    useConfirmAndPayCollateral({ summary, payoutNetwork });

  const locked = confirmingOrPaying || !!txId || startListen;

  // Start listening when txId appears
  useEffect(() => {
    if (!open) return;
    if (txId) setStartListen(true);
  }, [txId, open]);


  // Reset input when modal opens
  useEffect(() => {
    if (!open) return;
    setAddress("");
    setSubmitError("");
    setStartListen(false);
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

  // Remote validate address with debounce (UX)


  if (!open) return null;

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
  };

  const isAddressValid = !!address.trim() && !addressError && remoteValid === true;

  const handleConfirm = async () => {
    if (!loanId) return;

    const a = address.trim();
    if (!a) {
      setSubmitError("Enter an address");
      return;
    }

    try {
      setSubmitError("");

      const dep = effectiveLoan?.response?.deposit || {};
      const needsRefresh = dep?.active === false || !dep?.send_address;

      setBusyLabel(needsRefresh ? "Refreshing deposit address..." : "Opening wallet...");

      const { confirmRes, freshLoan: refreshed } = await run({
        loanId,
        payoutAddress: a,
      });

      setBusyLabel(""); // clear when done

      onConfirmed?.(confirmRes);
      if (refreshed) setFreshLoan(refreshed);
    } catch (err) {
      setSubmitError(err?.message || "Confirm failed");
    }
  };


  return (
    <ConfirmLoanModalView
      open={open}
      onClose={onClose}
      summary={summary}
      loanId={loanId}
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
      onConfirm={handleConfirm}
      statusContent={
        <LoanStatusLabel
          loanId={loanId}
          start={true}
          finishedLabel="finished"
          onFinished={() => {
            onClose?.();
            router.push("/dashboard/loans");
            router.refresh();
          }}
        />
      }
    />
  );

}
