"use client";

// app/dev/pledge-flow/page.jsx
// Simplified flow:
// 0) Load loan (auto-fill repay_by_code / repay_by_network)
// 1) Estimate repayment
// 2) POST pledge (creates repayment intent -> returns pay address + transactionId)
// 3) Pay with wallet (send to pledge response.address / loan.repayment.send_address)

import { useMemo, useState } from "react";
import { getIdToken } from "@/features/loan/services/session";
import { usePayRepayment } from "@/features/loan/hooks/usePayRepayment";
import useCurrencies from "@/features/loan/hooks/useCurrencies";


const UI = {
  page: {
    minHeight: "100vh",
    padding: 16,
    background: "#0b0f19",
    color: "#e5e7eb",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  },
  wrap: { maxWidth: 920, margin: "0 auto" },
  title: { margin: "0 0 12px 0", fontSize: 20, fontWeight: 800 },
  card: {
    border: "1px solid #27324a",
    borderRadius: 12,
    padding: 14,
    background: "#111827",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    marginBottom: 14,
  },
  h3: { margin: "0 0 8px 0", fontSize: 16, fontWeight: 800 },
  hint: { opacity: 0.85, marginTop: 6, fontSize: 13, lineHeight: 1.35 },
  grid: { display: "grid", gap: 10 },
  label: { fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#cbd5e1" },
  rowLabel: { display: "flex", gap: 10, alignItems: "center" },
  todo: { fontSize: 12, opacity: 0.85, color: "#93c5fd" },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #2a3752",
    background: "#0b1220",
    color: "#e5e7eb",
    outline: "none",
  },
  btn: (enabled, tone) => {
    const colors = {
      blue: "#2563eb",
      green: "#10b981",
      purple: "#8b5cf6",
      amber: "#f59e0b",
      gray: "#334155",
    };
    return {
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #2a3752",
      background: enabled ? colors[tone] : colors.gray,
      color: "#0b0f19",
      fontWeight: 900,
      cursor: enabled ? "pointer" : "not-allowed",
    };
  },
  err: { marginTop: 10, color: "#fb7185", whiteSpace: "pre-wrap", fontSize: 13 },
  ok: { marginTop: 10, color: "#34d399", whiteSpace: "pre-wrap", fontSize: 13 },
  pre: {
    marginTop: 10,
    background: "#0b1220",
    color: "#86efac",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #2a3752",
    overflow: "auto",
    fontSize: 12,
  },
  code: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
};

export default function PledgeFlowMiniPage() {
  // user input
  const [loanId, setLoanId] = useState("");

  // where CoinRabbit returns collateral after repayment
  const [returnAddress, setReturnAddress] = useState("");
  const [extraId, setExtraId] = useState("");

  // internal auto-filled repayment params (NO UI inputs)
  const [repayByNetwork, setRepayByNetwork] = useState("");
  const [repayByCode, setRepayByCode] = useState("");
  const [receiveFrom] = useState("external_wallet"); // fixed (simplified)

  // amount (comes from estimate / loan)
  const [amount, setAmount] = useState("");

  // loan state
  const [loanLoading, setLoanLoading] = useState(false);
  const [loanError, setLoanError] = useState("");
  const [loanResult, setLoanResult] = useState(null);

  // estimate state
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [estimateResult, setEstimateResult] = useState(null);

  // pledge state
  const [pledgeLoading, setPledgeLoading] = useState(false);
  const [pledgeError, setPledgeError] = useState("");
  const [pledgeResult, setPledgeResult] = useState(null);

  // currencies + pay hook
  const { currencies } = useCurrencies();
  const { run: payRun, loading: payLoading, txId: payTxId, error: payError } =
    usePayRepayment({ currencies });

  // derived
  const repaymentFromLoan = useMemo(() => {
    const raw = loanResult;
    return (
      raw?.data?.response?.repayment ||
      raw?.response?.repayment ||
      raw?.data?.data?.response?.repayment ||
      null
    );
  }, [loanResult]);

  // IMPORTANT: pay-to address is send_address (or pledge response.address)
  const payToAddress = useMemo(() => {
    return (
      String(pledgeResult?.response?.address || "").trim() ||
      String(repaymentFromLoan?.send_address || "").trim() ||
      ""
    );
  }, [pledgeResult, repaymentFromLoan]);

  const finalAmountToSend = useMemo(() => {
    // prefer loan.amount_to_repayment if present (final w/ fee)
    const fromLoan = String(repaymentFromLoan?.amount_to_repayment || "").trim();
      return fromLoan; //  si no hay, regresa ""
  }, [repaymentFromLoan]);

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

  // 0) load loan -> auto-fill repay_by_code/network + amount_to_repayment
  const onLoadLoan = async () => {
    setLoanLoading(true);
    setLoanError("");
    setLoanResult(null);

    try {
      const id = loanId.trim();
      if (!id) throw new Error("Missing loanId");

      const j = await authedFetchJSON(
        `/api/coinrabbit/loans/${encodeURIComponent(id)}`,
        { method: "GET" }
      );
      setLoanResult(j);

      const rep = j?.data?.response?.repayment || j?.response?.repayment || null;

      const code = String(rep?.currency_code || "").trim();
      const net = String(rep?.currency_network || "").trim();
      if (!code || !net) throw new Error("Loan repayment currency missing");

      setRepayByCode(code);
      setRepayByNetwork(net);

      const isActive = rep?.active === true && String(rep?.transaction_status || "").toLowerCase() !== "finished";

      const finalAmt = String(rep?.amount_to_repayment || "").trim();
      if (isActive && finalAmt) setAmount(finalAmt);


      return j;
    } catch (e) {
      setLoanError(e?.message || "Get loan failed");
      throw e;
    } finally {
      setLoanLoading(false);
    }
  };

  // 1) estimate (uses auto-filled repayBy*)
  const onEstimate = async () => {
    setEstimateLoading(true);
    setEstimateError("");
    setEstimateResult(null);

    try {
      const id = loanId.trim();
      if (!id) throw new Error("Missing loanId");
      if (!repayByCode || !repayByNetwork) {
        throw new Error("Load loan first (Step 0) to auto-fill repay currency");
      }

      const qs = new URLSearchParams({
        repay_by_network: repayByNetwork,
        repay_by_code: repayByCode,
        receive_from: receiveFrom,
      }).toString();

      const j = await authedFetchJSON(
        `/api/coinrabbit/pledge-estimate/${encodeURIComponent(id)}?${qs}`,
        { method: "GET" }
      );

      setEstimateResult(j);

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

  // 2) pledge (uses auto-filled repayBy*)
  const onPledge = async () => {
    setPledgeLoading(true);
    setPledgeError("");
    setPledgeResult(null);

    try {
      const id = loanId.trim();
      if (!id) throw new Error("Missing loanId");
      if (!repayByCode || !repayByNetwork) {
        throw new Error("Load loan first (Step 0)");
      }
      if (!returnAddress.trim()) throw new Error("Missing returnAddress");


      const payload = {
        address: returnAddress.trim(),
        extra_id: extraId.trim() ? extraId.trim() : null,
        receive_from: receiveFrom,
        repay_by_network: repayByNetwork,
        repay_by_code: repayByCode,
        // ✅ NO amount
      };


      const j = await authedFetchJSON(
        `/api/coinrabbit/pledge/${encodeURIComponent(id)}`,
        { method: "POST", body: JSON.stringify(payload) }
      );

      setPledgeResult(j);
      // ✅ Always refresh loan after pledge to get FINAL send_address + amount_to_repayment
      const fresh = await authedFetchJSON(
        `/api/coinrabbit/loans/${encodeURIComponent(id)}`,
        { method: "GET" }
      );
      setLoanResult(fresh);

      const rep2 = fresh?.data?.response?.repayment || fresh?.response?.repayment || null;

      const finalAmt2 = String(rep2?.amount_to_repayment || "").trim();
      if (finalAmt2) setAmount(finalAmt2);

      return j;
    } catch (e) {
      setPledgeError(e?.message || "Pledge failed");
      throw e;
    } finally {
      setPledgeLoading(false);
    }
  };

  // 3) pay (send to pledge response.address / loan.repayment.send_address)
  const onPay = async () => {
    try {
      const id = loanId.trim();

      // ✅ final preflight: read the FINAL invoice again
      const fresh = await authedFetchJSON(
        `/api/coinrabbit/loans/${encodeURIComponent(id)}`,
        { method: "GET" }
      );

      const rep = fresh?.data?.response?.repayment || fresh?.response?.repayment || null;

  const repayment = {
    send_address: String(rep?.send_address || "").trim(),
    address: String(rep?.address || "").trim(), // fallback
    currency_code: String(rep?.currency_code || "").trim(),
    currency_network: String(rep?.currency_network || "").trim(),

    // IMPORTANT: include both
    amount_to_repayment: String(rep?.amount_to_repayment || "").trim(),
    amount: String(rep?.amount || "").trim(),
    fee: String(rep?.fee || "").trim(),

    transaction_status: String(rep?.transaction_status || "").trim(),
    active: rep?.active === true,
    payin_txs: Array.isArray(rep?.payin_txs) ? rep.payin_txs : [],
  };

  await payRun({ repayment });


      await payRun({ repayment });
    } catch (_) {}
  };

  const canLoad = !loanLoading && loanId.trim();
  const canEstimate =
    !estimateLoading && loanId.trim() && repayByCode && repayByNetwork;
  const canPledge =
    !pledgeLoading &&
    loanId.trim() &&
    repayByCode &&
    repayByNetwork &&
    returnAddress.trim() &&
    String(amount).trim();
  const canPay =
    !payLoading &&
    String(repaymentFromLoan?.send_address || "").trim() &&
    String(repaymentFromLoan?.amount_to_repayment || "").trim() &&
    repayByCode &&
    repayByNetwork;

  return (
    <div style={UI.page}>
      <div style={UI.wrap}>
        <h2 style={UI.title}>Pledge Repayment (simple)</h2>

        {/* Inputs */}
        <div style={UI.card}>
          <h3 style={UI.h3}>Inputs</h3>

          <div style={UI.grid}>
            <label>
              <div style={UI.label}>loanId</div>
              <input
                value={loanId}
                onChange={(e) => setLoanId(e.target.value)}
                placeholder="e.g. 5823591106"
                style={UI.input}
              />
            </label>

            <label>
              <div style={UI.rowLabel}>
                <span style={UI.label}>
                  return address (where collateral should be returned)
                </span>
                <span style={UI.todo}>TODO: implement validate address</span>
              </div>
              <input
                value={returnAddress}
                onChange={(e) => setReturnAddress(e.target.value)}
                placeholder="0x... / btc... / sol..."
                style={UI.input}
              />
            </label>

            <label>
              <div style={UI.label}>extra_id (optional memo/tag)</div>
              <input
                value={extraId}
                onChange={(e) => setExtraId(e.target.value)}
                placeholder="leave empty if not needed"
                style={UI.input}
              />
            </label>

            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
              <div>
                <b>Repay in:</b>{" "}
                <span style={UI.code}>
                  {repayByCode && repayByNetwork
                    ? `${repayByCode} / ${repayByNetwork}`
                    : "(load loan first)"}
                </span>
              </div>
              <div>
                <b>Amount:</b>{" "}
                <span style={UI.code}>
                  {finalAmountToSend ? finalAmountToSend : "(estimate / load loan)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 0 */}
        <div style={UI.card}>
          <h3 style={UI.h3}>0) Load loan (auto-fill repay coin/network)</h3>
          <button onClick={onLoadLoan} disabled={!canLoad} style={UI.btn(canLoad, "purple")}>
            {loanLoading ? "Loading..." : "Get loan by id"}
          </button>

          {loanError ? <div style={UI.err}>Loan error: {loanError}</div> : null}

          {repaymentFromLoan ? (
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5 }}>
              <div>
                <b>Pay-to address (send_address):</b>{" "}
                <span style={UI.code}>
                  {String(repaymentFromLoan?.send_address || "").trim() || "(not yet)"}
                </span>
              </div>
              <div style={{ marginTop: 6 }}>
                <b>amount_to_repayment:</b>{" "}
                <span style={UI.code}>
                  {String(repaymentFromLoan?.amount_to_repayment || "").trim() || "(not yet)"}
                </span>
              </div>
            </div>
          ) : null}

          {loanResult ? <pre style={UI.pre}>{JSON.stringify(loanResult, null, 2)}</pre> : null}
        </div>

        {/* Step 1 */}
        <div style={UI.card}>
          <h3 style={UI.h3}>1) Estimate repayment</h3>
          <button onClick={onEstimate} disabled={!canEstimate} style={UI.btn(canEstimate, "blue")}>
            {estimateLoading ? "Estimating..." : "Get estimate"}
          </button>

          {estimateError ? <div style={UI.err}>Estimate error: {estimateError}</div> : null}
          {estimateResult ? <pre style={UI.pre}>{JSON.stringify(estimateResult, null, 2)}</pre> : null}
        </div>

        {/* Step 2 */}
        <div style={UI.card}>
          <h3 style={UI.h3}>2) POST pledge</h3>
          <p style={UI.hint}>
            This creates the repayment intent and returns the address you must pay to.
          </p>

          <div style={{ marginBottom: 10 }}>
            <div style={UI.label}>amount (auto)</div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} style={UI.input} />
          </div>

          <button onClick={onPledge} disabled={!canPledge} style={UI.btn(canPledge, "green")}>
            {pledgeLoading ? "Sending..." : "Create repayment (pledge)"}
          </button>

          {pledgeError ? <div style={UI.err}>Pledge error: {pledgeError}</div> : null}

          {pledgeResult ? (
            <>
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5 }}>
                <div>
                  <b>Pay-to address (from pledge):</b>{" "}
                  <span style={UI.code}>
                    {String(pledgeResult?.response?.address || "").trim() || "(missing)"}
                  </span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <b>transactionId:</b>{" "}
                  <span style={UI.code}>
                    {String(pledgeResult?.response?.transactionId || "").trim() || "(missing)"}
                  </span>
                </div>
              </div>
              <pre style={UI.pre}>{JSON.stringify(pledgeResult, null, 2)}</pre>
            </>
          ) : null}
        </div>

        {/* Step 3 */}
        <div style={UI.card}>
          <h3 style={UI.h3}>3) Pay (opens wallet)</h3>

          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
            <div>
              <b>Send to:</b> <span style={UI.code}>{payToAddress || "(run pledge first)"}</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <b>Amount:</b> <span style={UI.code}>{finalAmountToSend || "(missing)"}</span>
            </div>
          </div>

          <button onClick={onPay} disabled={!canPay} style={UI.btn(canPay, "amber")}>
            {payLoading ? "Opening wallet..." : "Pay"}
          </button>

          {payError ? <div style={UI.err}>Pay error: {payError}</div> : null}
          {payTxId ? (
            <div style={UI.ok}>
              Tx: <span style={UI.code}>{payTxId}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
