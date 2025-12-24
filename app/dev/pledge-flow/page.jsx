"use client";

// app/dev/pledge-flow/page.jsx
// New flow (per updated docs):
// 1) Estimate repayment
// 2) Create repayment (POST pledge)
// 3) IMPORTANT: Get loan by id BEFORE Pay -> repayment.receive_address + amount_to_repayment
// 4) (Later) Pay with wallet

import { useMemo, useState } from "react";
import { getIdToken } from "@/features/loan/services/session";

export default function PledgeFlowMiniPage() {
  // Core inputs
  const [loanId, setLoanId] = useState("");

  // Where CoinRabbit returns collateral AFTER repayment
  const [address, setAddress] = useState("");
  const [extraId, setExtraId] = useState("");

  // Repayment config (from CoinRabbit example)
  const [receiveFrom, setReceiveFrom] = useState("external_wallet");
  const [repayByNetwork, setRepayByNetwork] = useState("BASE");
  const [repayByCode, setRepayByCode] = useState("USDC");

  // Amount (should come from estimate; final might come from loan.repayment.amount_to_repayment)
  const [amount, setAmount] = useState("");

  // Estimate state
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [estimateResult, setEstimateResult] = useState(null);

  // Pledge state
  const [pledgeLoading, setPledgeLoading] = useState(false);
  const [pledgeError, setPledgeError] = useState("");
  const [pledgeResult, setPledgeResult] = useState(null);

  // Get loan by id (repayment details) state
  const [loanLoading, setLoanLoading] = useState(false);
  const [loanError, setLoanError] = useState("");
  const [loanResult, setLoanResult] = useState(null);

  const canEstimate = useMemo(() => {
    return (
      !estimateLoading &&
      loanId.trim() &&
      repayByNetwork.trim() &&
      repayByCode.trim()
    );
  }, [estimateLoading, loanId, repayByNetwork, repayByCode]);

  const canPledge = useMemo(() => {
    return (
      !pledgeLoading &&
      loanId.trim() &&
      address.trim() &&
      receiveFrom.trim() &&
      repayByNetwork.trim() &&
      repayByCode.trim() &&
      String(amount).trim()
    );
  }, [
    pledgeLoading,
    loanId,
    address,
    receiveFrom,
    repayByNetwork,
    repayByCode,
    amount,
  ]);

  const canRefreshLoan = useMemo(() => {
    return !loanLoading && loanId.trim();
  }, [loanLoading, loanId]);

  const repaymentFromLoan = useMemo(() => {
    // depending on your proxy shape, loanResult might be {result,response} or {status,ok,data:{...}}
    const raw = loanResult;
    const r =
      raw?.data?.response?.repayment ||
      raw?.response?.repayment ||
      raw?.data?.data?.response?.repayment ||
      null;
    return r;
  }, [loanResult]);

  const paymentAddress = repaymentFromLoan?.receive_address || "";
  const finalAmountToSend = repaymentFromLoan?.amount_to_repayment || "";

  async function authedFetchJSON(url, options = {}) {
    const idToken = await getIdToken();
    if (!idToken) throw new Error("No logged in user");

    const r = await fetch(url, {
      cache: "no-store",
      ...options,
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || j?.message || `HTTP ${r.status}`);
    return j;
  }

  const onEstimate = async () => {
    setEstimateLoading(true);
    setEstimateError("");
    setEstimateResult(null);

    try {
      const id = loanId.trim();

      const qs = new URLSearchParams({
        repay_by_network: repayByNetwork.trim(),
        repay_by_code: repayByCode.trim(),
        receive_from: receiveFrom.trim(),
      }).toString();

      const j = await authedFetchJSON(
        `/api/coinrabbit/pledge-estimate/${encodeURIComponent(id)}?${qs}`,
        { method: "GET" }
      );

      setEstimateResult(j);

      // CoinRabbit estimate response: { response: { amount: "..." } }
      const suggested = j?.response?.amount;
      if (suggested != null && String(suggested).trim() !== "") {
        setAmount(String(suggested));
      }

      return j;
    } catch (e) {
      setEstimateError(e?.message || "Estimate failed");
      throw e;
    } finally {
      setEstimateLoading(false);
    }
  };

  const onPledge = async () => {
    setPledgeLoading(true);
    setPledgeError("");
    setPledgeResult(null);

    try {
      const id = loanId.trim();

      const payload = {
        address: address.trim(),
        extra_id: extraId.trim() ? extraId.trim() : null,
        receive_from: receiveFrom.trim(),
        repay_by_network: repayByNetwork.trim(),
        repay_by_code: repayByCode.trim(),
        amount: String(amount).trim(), // keep string (CoinRabbit accepts it)
      };

      const j = await authedFetchJSON(
        `/api/coinrabbit/pledge/${encodeURIComponent(id)}`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setPledgeResult(j);
      return j;
    } catch (e) {
      setPledgeError(e?.message || "Pledge failed");
      throw e;
    } finally {
      setPledgeLoading(false);
    }
  };

  const onRefreshLoan = async () => {
    setLoanLoading(true);
    setLoanError("");
    setLoanResult(null);

    try {
      const id = loanId.trim();
      const j = await authedFetchJSON(
        `/api/coinrabbit/loans/${encodeURIComponent(id)}`,
        { method: "GET" }
      );

      setLoanResult(j);

      // Optional: prefer final amount from loan repayment section (includes fee)
      const rep =
        j?.data?.response?.repayment || j?.response?.repayment || null;
      const finalAmt = rep?.amount_to_repayment;
      if (finalAmt != null && String(finalAmt).trim() !== "") {
        setAmount(String(finalAmt));
      }

      return j;
    } catch (e) {
      setLoanError(e?.message || "Get loan by id failed");
      throw e;
    } finally {
      setLoanLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 900 }}>
      <h2 style={{ marginBottom: 8 }}>
        Pledge Repayment Flow (Estimate → Pledge → Get Loan → Pay later)
      </h2>

      {/* Inputs */}
      <div
        style={{
          border: "1px solid #333",
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Inputs</h3>

        <div style={{ display: "grid", gap: 10 }}>
          <label>
            <div>loanId</div>
            <input
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              placeholder="e.g. 5823591106"
              style={{ width: "100%", padding: 8, backgroundColor: "#2a2a2a", border: "1px solid #555", borderRadius: 4, color: "#fff" }}
            />
          </label>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <label>
              <div>repay_by_network</div>
              <input
                value={repayByNetwork}
                onChange={(e) => setRepayByNetwork(e.target.value)}
                placeholder="e.g. BASE"
                style={{ width: "100%", padding: 8, backgroundColor: "#2a2a2a", border: "1px solid #555", borderRadius: 4, color: "#fff" }}
              />
            </label>

            <label>
              <div>repay_by_code</div>
              <input
                value={repayByCode}
                onChange={(e) => setRepayByCode(e.target.value)}
                placeholder="e.g. USDC"
                style={{ width: "100%", padding: 8, backgroundColor: "#2a2a2a", border: "1px solid #555", borderRadius: 4, color: "#fff" }}
              />
            </label>
          </div>

          <label>
            <div>receive_from</div>
            <input
              value={receiveFrom}
              onChange={(e) => setReceiveFrom(e.target.value)}
              placeholder='e.g. "external_wallet"'
              style={{ width: "100%", padding: 8, backgroundColor: "#2a2a2a", border: "1px solid #555", borderRadius: 4, color: "#fff" }}
            />
          </label>

          <label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span>address (where collateral should be returned)</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                TODO: implement validate address
              </span>
            </div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              style={{ width: "100%", padding: 8, backgroundColor: "#2a2a2a", border: "1px solid #555", borderRadius: 4, color: "#fff" }}
            />
          </label>

          <label>
            <div>extra_id (optional memo/tag)</div>
            <input
              value={extraId}
              onChange={(e) => setExtraId(e.target.value)}
              placeholder="leave empty if not needed"
              style={{ width: "100%", padding: 8, backgroundColor: "#2a2a2a", border: "1px solid #555", borderRadius: 4, color: "#fff" }}
            />
          </label>

          <label>
            <div>amount (use Estimate first; may be overridden by Get Loan)</div>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="auto-filled"
              style={{ width: "100%", padding: 8, backgroundColor: "#2a2a2a", border: "1px solid #555", borderRadius: 4, color: "#fff" }}
            />
          </label>
        </div>
      </div>

      {/* Step 1: Estimate */}
      <div
        style={{
          border: "1px solid #333",
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>1) Estimate repayment</h3>

        <button
          onClick={onEstimate}
          disabled={!canEstimate}
          style={{ padding: 10, cursor: canEstimate ? "pointer" : "not-allowed", backgroundColor: canEstimate ? "#0070f3" : "#555", color: "#fff", border: "none", borderRadius: 4, fontWeight: 500 }}
        >
          {estimateLoading ? "Estimating..." : "Get estimate"}
        </button>

        {estimateError ? (
          <div style={{ marginTop: 10, color: "tomato", whiteSpace: "pre-wrap" }}>
            Estimate error: {estimateError}
          </div>
        ) : null}

        {estimateResult ? (
          <pre
            style={{
              marginTop: 10,
              background: "#111",
              color: "#0f0",
              padding: 12,
              overflow: "auto",
            }}
          >
            {JSON.stringify(estimateResult, null, 2)}
          </pre>
        ) : null}
      </div>

      {/* Step 2: Pledge */}
      <div
        style={{
          border: "1px solid #333",
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>2) Create repayment (POST pledge)</h3>

        <button
          onClick={onPledge}
          disabled={!canPledge}
          style={{ padding: 10, cursor: canPledge ? "pointer" : "not-allowed", backgroundColor: canPledge ? "#10b981" : "#555", color: "#fff", border: "none", borderRadius: 4, fontWeight: 500 }}
        >
          {pledgeLoading ? "Sending..." : "POST pledge repayment"}
        </button>

        {pledgeError ? (
          <div style={{ marginTop: 10, color: "tomato", whiteSpace: "pre-wrap" }}>
            Pledge error: {pledgeError}
          </div>
        ) : null}

        {pledgeResult ? (
          <pre
            style={{
              marginTop: 10,
              background: "#111",
              color: "#0f0",
              padding: 12,
              overflow: "auto",
            }}
          >
            {JSON.stringify(pledgeResult, null, 2)}
          </pre>
        ) : null}
      </div>

      {/* Step 3: Get loan by id (required before Pay) */}
      <div
        style={{
          border: "1px solid #333",
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>3) Get Loan by id (BEFORE Pay)</h3>
        <p style={{ opacity: 0.85, marginTop: 6 }}>
          Reminder: the <b>payment address</b> for repayment comes from{" "}
          <code>loan.response.repayment.receive_address</code>.
        </p>

        <button
          onClick={onRefreshLoan}
          disabled={!canRefreshLoan}
          style={{ padding: 10, cursor: canRefreshLoan ? "pointer" : "not-allowed", backgroundColor: canRefreshLoan ? "#8b5cf6" : "#555", color: "#fff", border: "none", borderRadius: 4, fontWeight: 500 }}
        >
          {loanLoading ? "Loading..." : "Refresh loan (Get by id)"}
        </button>

        {loanError ? (
          <div style={{ marginTop: 10, color: "tomato", whiteSpace: "pre-wrap" }}>
            Get loan error: {loanError}
          </div>
        ) : null}

        {repaymentFromLoan ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              <b>Payment address (receive_address):</b>{" "}
              <code>{paymentAddress || "(missing)"}</code>
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>
              <b>Final amount to send (amount_to_repayment):</b>{" "}
              <code>{finalAmountToSend || "(missing)"}</code>
            </div>
          </div>
        ) : null}

        {loanResult ? (
          <pre
            style={{
              marginTop: 10,
              background: "#111",
              color: "#0f0",
              padding: 12,
              overflow: "auto",
            }}
          >
            {JSON.stringify(loanResult, null, 2)}
          </pre>
        ) : null}
      </div>

      {/* Step 4: Pay (placeholder) */}
      <div
        style={{
          border: "1px dashed #555",
          borderRadius: 10,
          padding: 14,
        }}
      >
        <h3 style={{ marginTop: 0 }}>4) Pay with wallet (TODO)</h3>
        <p style={{ opacity: 0.85, marginTop: 6 }}>
          TODO: create a real “Pay” button that sends{" "}
          <b>{repayByCode}/{repayByNetwork}</b> to{" "}
          <code>repayment.receive_address</code>.
        </p>
        <button disabled style={{ padding: 10, opacity: 0.6 }}>
          Pay (coming next)
        </button>
      </div>
    </div>
  );
}
