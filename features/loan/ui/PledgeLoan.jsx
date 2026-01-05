"use client";

// Recommended flow (per CoinRabbit):

// 0) Load loan (auto-fill repay_by_code / repay_by_network)
// 1) POST /loans/:id/pledge   DO NOT pass "amount" (creates repayment operation + address)
// 2) GET /loans/:id           source of truth: repayment.send_address + repayment.amount_to_repayment
// 3) Pay with wallet (send EXACT amount_to_repayment to send_address)
//
// Note: GET pledge estimate can stay for dashboard/UI, but it’s OPTIONAL (not required to close the loan).

import { useEffect, useMemo, useState } from "react";
import {
  getLoanById,
  getPledgeEstimate,
  createPledgeRedemptionTx,
} from "@/features/loan/services/coinrabbit";
import { useValidateAddress } from "@/features/loan/hooks/useValidateAddress";
import { usePayRepayment } from "@/features/loan/hooks/usePayRepayment";
import useCurrencies from "@/features/loan/hooks/useCurrencies";
import { useRouter } from "next/navigation";
import LoanStatusLabel from "@/features/loan/ui/LoanStatusLabel";


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

export default function PledgeFlowMiniPage({ loanId }) {
  // loanId comes from the URL params (dashboard route)
  const loanIdFromUrl = String(loanId || "").trim();

  const router = useRouter();

  // where CoinRabbit returns collateral after repayment
    const [returnAddress, setReturnAddress] = useState("");

  // collateral currency (NO UI inputs, for validation only)
    const [collateralCode, setCollateralCode] = useState("");
    const [collateralNetwork, setCollateralNetwork] = useState("");


  // internal auto-filled repayment params (NO UI inputs)
    const [repayByNetwork, setRepayByNetwork] = useState("");
    const [repayByCode, setRepayByCode] = useState("");
    const [receiveFrom] = useState("external_wallet"); // fixed (simplified)

  // loan state
    const [loanLoading, setLoanLoading] = useState(false);
    const [loanError, setLoanError] = useState("");
    const [loanResult, setLoanResult] = useState(null);

  // estimate state (OPTIONAL UI)
    const [estimateLoading, setEstimateLoading] = useState(false);
    const [estimateError, setEstimateError] = useState("");
    const [estimateResult, setEstimateResult] = useState(null);
    const [showEstimate, setShowEstimate] = useState(false);

  // pledge state
    const [pledgeLoading, setPledgeLoading] = useState(false);
    const [pledgeError, setPledgeError] = useState("");
    const [pledgeResult, setPledgeResult] = useState(null);

  // validate return address
    const {
      validating: validatingReturn,
      valid: returnRemoteValid,
      error: returnAddressError,
    } = useValidateAddress({
      address: returnAddress,
      code: collateralCode,
      network: collateralNetwork,
      enabled: true,
    });


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

  // ✅ Source of truth for pay-to is repayment.send_address (after pledge + GET loan)
  const payToAddress = useMemo(() => {
    return (
      String(repaymentFromLoan?.send_address || "").trim() ||
      String(pledgeResult?.response?.address || "").trim() || // fallback display only
      ""
    );
  }, [repaymentFromLoan, pledgeResult]);

  const finalAmountToSend = useMemo(() => {
    // ✅ Source of truth: repayment.amount_to_repayment (after pledge + GET loan)
    return String(repaymentFromLoan?.amount_to_repayment || "").trim();
  }, [repaymentFromLoan]);

  // 0) load loan -> auto-fill repay_by_code/network
  const onLoadLoan = async () => {
    setLoanLoading(true);
    setLoanError("");
    setLoanResult(null);

    try {
      const id = loanIdFromUrl;
      if (!id) throw new Error("Missing loanId");

      const j = await getLoanById(id);
      setLoanResult(j);

      const dep = j?.data?.response?.deposit || j?.response?.deposit || null;

      const dCode = String(dep?.currency_code || dep?.currency || "").trim().toUpperCase();
      const dNet = String(dep?.currency_network || dep?.currencyNetwork || "").trim().toUpperCase();

      if (dCode) setCollateralCode(dCode);
      if (dNet) setCollateralNetwork(dNet);


      const rep = j?.data?.response?.repayment || j?.response?.repayment || null;

      const code = String(rep?.currency_code || "").trim();
      const net = String(rep?.currency_network || "").trim();
      if (!code || !net) throw new Error("Loan repayment currency missing");

      setRepayByCode(code);
      setRepayByNetwork(net);

      return j;
    } catch (e) {
      setLoanError(e?.message || "Get loan failed");
      throw e;
    } finally {
      setLoanLoading(false);
    }
  };

  useEffect(() => {
    if (!loanIdFromUrl) return;

    let cancelled = false;

    const run = async (tries = 0) => {
      try {
        await onLoadLoan();
      } catch (e) {
        const msg = String(e?.message || "");

        // Firebase is not ready yet 
        if (!cancelled && msg.includes("No logged in user") && tries < 8) {
          setTimeout(() => run(tries + 1), 350);
          return;
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanIdFromUrl]);

  // OPTIONAL: estimate (for UI/dash only)
  const onEstimate = async () => {
    setEstimateLoading(true);
    setEstimateError("");
    setEstimateResult(null);

    try {
      const id = loanIdFromUrl;
      if (!id) throw new Error("Missing loanId");
      if (!repayByCode || !repayByNetwork) {
        throw new Error("Load loan first (Step 0) to auto-fill repay currency");
      }

      const qs = new URLSearchParams({
        repay_by_network: repayByNetwork,
        repay_by_code: repayByCode,
        receive_from: receiveFrom,
      }).toString();

      const j = await getPledgeEstimate(id, {
        repay_by_network: repayByNetwork,
        repay_by_code: repayByCode,
        receive_from: receiveFrom,
      });
      setEstimateResult(j);
      return j;
    } catch (e) {
      setEstimateError(e?.message || "Estimate failed");
      throw e;
    } finally {
      setEstimateLoading(false);
    }
  };

  // 1) pledge (NO amount)
  const onPledge = async () => {
    setPledgeLoading(true);
    setPledgeError("");
    setPledgeResult(null);

    try {
      const id = loanIdFromUrl;
      if (!id) throw new Error("Missing loanId");
      if (!repayByCode || !repayByNetwork) {
        throw new Error("Load loan first (Step 0)");
      }
      if (!returnAddress.trim()) throw new Error("Missing returnAddress");

      const payload = {
        address: returnAddress.trim(),
        extra_id: null,
        receive_from: receiveFrom,
        repay_by_network: repayByNetwork,
        repay_by_code: repayByCode,
        // ✅ DO NOT send amount
      };

      const j = await createPledgeRedemptionTx(id, {
        address: returnAddress.trim(),
        extra_id: null,
        receive_from: receiveFrom,
        repay_by_network: repayByNetwork,
        repay_by_code: repayByCode,
      });
      setPledgeResult(j);

      // refresh loan
      const fresh = await getLoanById(id);
      setLoanResult(fresh);

      return j;

    } catch (e) {
      setPledgeError(e?.message || "Pledge failed");
      throw e;
    } finally {
      setPledgeLoading(false);
    }
  };

  // 2) pay (always preflight GET loan again)
  const onPay = async () => {
    try {
      const id = loanIdFromUrl;
      if (!id) throw new Error("Missing loanId");

      const fresh = await getLoanById(id);
      setLoanResult(fresh);

      const rep =
        fresh?.data?.response?.repayment || fresh?.response?.repayment || null;

      const repayment = {
        send_address: String(rep?.send_address || "").trim(),
        currency_code: String(rep?.currency_code || "").trim(),
        currency_network: String(rep?.currency_network || "").trim(),
        amount_to_repayment: String(rep?.amount_to_repayment || "").trim(),
      };

      await payRun({ repayment });
    } catch (_) {}
  };

  const canLoad = !loanLoading && loanIdFromUrl;


  const isReturnAddressValidated =
    returnRemoteValid === true && !validatingReturn && !!returnAddress.trim();


  const canPledge =
    !pledgeLoading &&
    loanIdFromUrl &&
    repayByCode &&
    repayByNetwork &&
    returnAddress.trim() &&
    isReturnAddressValidated;


  const canPay =
    !payLoading &&
    !payTxId &&
    payToAddress &&
    finalAmountToSend &&
    repayByCode &&
    repayByNetwork;


  const canEstimate =
    !estimateLoading && loanIdFromUrl && repayByCode && repayByNetwork;

  return (
    <div style={UI.page}>
      <div style={UI.wrap}>
        <h2 style={UI.title}>Repay your loan</h2>
        {/* back to my loans */}
        <button
          type="button"
          onClick={() => router.push("/dashboard/loans")}
          style={{
            padding: "10px 18px",
            background: "#eee",
            color: "#444",
            border: "none",
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 1px 4px 0 rgba(0,0,0,0.04)",
            width: "fit-content",
          }}
        >
          ← Back to my loans
        </button>


        {/* Inputs */}
        <div style={UI.card}>
          <h3 style={UI.h3}>Your details</h3>

          <div style={UI.grid}>
            <label>
              <div style={UI.rowLabel}>
                <span style={UI.label}>
                  Where should we return your collateral?
                </span>
              </div>
              <input
                value={returnAddress}
                onChange={(e) => setReturnAddress(e.target.value)}
                placeholder="Paste your wallet address 0x... / btc... / sol..."
                style={UI.input}
              />
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                Checking address for: <span style={UI.code}>{collateralCode}/{collateralNetwork || "..."}</span>
              </div>

              {validatingReturn ? (
                <div style={{ fontSize: 12, opacity: 0.85 }}>Checking address…</div>
              ) : null}

              {returnAddressError ? <div style={UI.err}>{returnAddressError}</div> : null}

              {returnRemoteValid === true && !returnAddressError ? (
                <div style={UI.ok}>Address looks good</div>
              ) : null}
            </label>

            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
              <div>
                <b>You will repay in:</b>{" "}
                <span style={UI.code}>
                  {repayByCode && repayByNetwork
                    ? `${repayByCode} / ${repayByNetwork}`
                    : "(load loan first)"}
                </span>
              </div>
              <div>
                <b>Amount to repay:</b>{" "}
                <span style={UI.code}>
                  {finalAmountToSend ? finalAmountToSend : "(create repayment request first)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 0 (hidden) */}
        {false && (
          <div style={UI.card}>
            <h3 style={UI.h3}>0) Load loan (auto-fill repay coin/network)</h3>
            <button
              onClick={onLoadLoan}
              disabled={!canLoad}
              style={UI.btn(canLoad, "purple")}
            >
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

            {loanResult ? (
              <pre style={UI.pre}>{JSON.stringify(loanResult, null, 2)}</pre>
            ) : null}
          </div>
        )}

        {/* Step 1 */}
        <div style={UI.card}>
          <h3 style={UI.h3}>Step 1 — Create repayment request</h3>
          <p style={UI.hint}>
            ✅ IMPORTANT: we do <b>NOT</b> send <span style={UI.code}>amount</span> in this request.
            we will show the exact amount to send after this step.{" "}
            {/* <span style={UI.code}>amount_to_repayment</span>. */}
          </p>

          <button
            onClick={onPledge}
            disabled={!canPledge}
            style={UI.btn(canPledge, "green")}
          >
            {pledgeLoading ? "Sending..." : "Get payment details"}
          </button>

          {pledgeError ? <div style={UI.err}>Pledge error: {pledgeError}</div> : null}

          {pledgeResult ? (
            <>
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5 }}>
                <div>
                  <b>Address returned by pledge (FYI):</b>{" "}
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

        {/* Step 2 */}
        <div style={UI.card}>
          <h3 style={UI.h3}>Step 2 — Send payment</h3>

          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>
            <div>
              <b>Send to this address:</b>{" "}
              <span style={UI.code}>
                {payToAddress || "(Create repayment request first)"}
              </span>
            </div>
            <div style={{ marginTop: 6 }}>
              <b>Send this exact amount:</b>{" "}
              <span style={UI.code}>{finalAmountToSend || "(missing)"}</span>
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

        {/* OPTIONAL: Estimate */}
        <div style={UI.card}>
          <h3 style={UI.h3}>
            Optional — Estimated costs
          </h3>
          <p style={UI.hint}>
            This is just an estimate. You can skip it.
          </p>

          <button
            onClick={() => setShowEstimate((v) => !v)}
            style={UI.btn(true, "gray")}
          >
            {showEstimate ? "Hide estimate tools" : "Show estimate"}
          </button>

          {showEstimate ? (
            <div style={{ marginTop: 10 }}>
              <button
                onClick={onEstimate}
                disabled={!canEstimate}
                style={UI.btn(canEstimate, "blue")}
              >
                {estimateLoading ? "Estimating..." : "Get estimate"}
              </button>

              {estimateError ? (
                <div style={UI.err}>Estimate error: {estimateError}</div>
              ) : null}
              {estimateResult ? (
                <pre style={UI.pre}>{JSON.stringify(estimateResult, null, 2)}</pre>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Step 3: monitor repayment */}
        {payTxId ? (
          <div style={UI.card}>
            <h3 style={UI.h3}>Confirming your payment</h3>

            <div style={{ fontSize: 13, opacity: 0.9 }}>
              Tx: <span style={UI.code}>{payTxId}</span>
            </div>

            <div style={{ marginTop: 10 }}>
              <LoanStatusLabel
                loanId={loanIdFromUrl}
                start={true}
                stopOnDepositFinished={false}
                closedLabel="CLOSED"
                onFinished={() => {
                  router.push("/dashboard/loans");
                  router.refresh();
                }}
              />
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
