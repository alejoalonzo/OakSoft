"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getLoanById } from "@/features/loan/services/coinrabbit";

// Terminal states: tweak if CoinRabbit uses different strings
function isClosed(resp) {
  const status = String(resp?.status || "").toLowerCase();
  if (!status) return false;

  return (
    status.includes("closed") ||
    status.includes("completed") ||
    status.includes("repaid") ||
    status.includes("cancel") ||
    status.includes("liquidat")
  );
}

// Increase/deposit tx terminal state (CoinRabbit uses waiting/confirming/finished)
function isDepositFinished(resp) {
  const depTx = String(resp?.deposit?.transaction_status || "").toLowerCase();
  return depTx.includes("finished");
}

function fmtHash(h) {
  if (!h || h === "-") return "-";
  const s = String(h);
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export default function LoanStatusLabel({
  loanId,
  start = false, // start polling only after user sent collateral tx
  pollMs = 8000,
  closedLabel = "CLOSED",
  finishedLabel = "FINISHED",
  stopOnDepositFinished = true,
  onFinished,
}) {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [finalText, setFinalText] = useState(""); // keeps final forever once set

  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  const stopPolling = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const label = useMemo(() => {
    if (!loanId) return "No loanId";
    if (finalText) return finalText;
    if (error) return `Error: ${error}`;
    if (!start) return "Waiting for collateral tx...";
    if (!snapshot) return "Listening...";

    const r = snapshot?.response || {};
    const dep = r?.deposit || {};
    const loan = r?.loan || {};

    const status = r?.status || "-";
    const depActive = dep?.active === true ? "active" : "inactive";
    const depTx = dep?.transaction_status || "-";
    const depHash = fmtHash(dep?.transaction_hash || dep?.payin_tx?.hash);
    const payoutHash = fmtHash(loan?.payout_tx?.hash);

    return `status=${status} | deposit=${depTx}(${depActive}) tx=${depHash} | payout=${payoutHash}`;
  }, [loanId, start, snapshot, error, finalText]);

  useEffect(() => {
    // If we already reached a final state, never poll again
    if (finalText) {
      stopPolling();
      return;
    }

    // Do not poll until start=true
    if (!loanId || !start) {
      stopPolling();
      return;
    }

    setError("");

    const tick = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        const data = await getLoanById(loanId);
        setSnapshot(data);

        const resp = data?.response || {};

        // 1) Stop if deposit tx is finished (waiting/confirming/finished)
        if (stopOnDepositFinished && isDepositFinished(resp)) {
          setFinalText(finishedLabel);
          stopPolling();
          onFinished?.(data);
          return;
        }

        // 2) Stop if loan is closed for real
        if (isClosed(resp)) {
          setFinalText(closedLabel);
          stopPolling();
          onFinished?.(data);
          return;
        }
      } catch (e) {
        setError(e?.message || "Get loan failed");
      } finally {
        inFlightRef.current = false;
      }
    };

    tick();
    timerRef.current = setInterval(tick, Math.max(3000, Number(pollMs) || 8000));

    return () => stopPolling();
  }, [loanId, start, pollMs, finalText, closedLabel, finishedLabel,stopOnDepositFinished]);

  return (
    <div className="text-xs">
      <span className="font-mono">{label}</span>
    </div>
  );
}
