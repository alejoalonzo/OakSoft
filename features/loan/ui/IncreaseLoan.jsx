"use client";


import { useState, useEffect } from "react";
import { getIncreaseEstimate, refreshDepositAddress } from "@/features/loan/services/session";
import LoanStatusLabel from "@/features/loan/ui/LoanStatusLabel";
import { useIncreaseAndPayCollateral } from "@/features/loan/hooks/useIncreaseAndPayCollateral";

export default function IncreaseLoan({ loanId }) {
  const loanIdFromUrl = String(loanId || "").trim();
  
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [depositOut, setDepositOut] = useState(null);
    const [depositErr, setDepositErr] = useState(null);
    const [loadingDeposit, setLoadingDeposit] = useState(false);

    const [increaseAmount, setIncreaseAmount] = useState("0.001");
    const [increaseOut, setIncreaseOut] = useState(null);
    const [increaseErr, setIncreaseErr] = useState(null);
    const [loadingIncrease, setLoadingIncrease] = useState(false);

    const [increaseFlowOut, setIncreaseFlowOut] = useState(null);
    const [increaseFlowErr, setIncreaseFlowErr] = useState("");


    const [startListen, setStartListen] = useState(false);

    useEffect(() => {
        setStartListen(false);
        setIncreaseOut(null);
        setIncreaseFlowOut(null);
        setIncreaseFlowErr("");
        setIncreaseErr(null);
    }, [loanIdFromUrl]);


  const {
    run: runIncreaseFlow,
    loading: increaseFlowLoading,
    txId: increaseFlowTxId,
    error: increaseFlowHookErr,
  } = useIncreaseAndPayCollateral({ summary: null });


  const runRefreshDeposit = async (e) => {
    e?.preventDefault?.();
    setDepositErr(null);
    setDepositOut(null);

    const id = loanIdFromUrl.trim();
    if (!id) {
      setDepositErr("Missing loanId");
      return;
    }

    setLoadingDeposit(true);
    try {
        const j = await refreshDepositAddress(id); // <-- service

        const addr = j?.response?.address || null;

    setDepositOut({
        ok: true,
        status: 200,
        data: j,
        extracted: {
        address: addr,
        isSuccess: j?.result === true && !!addr,
        },
    });
    } catch (e2) {
        setDepositErr(e2.message);
        setDepositOut({
            ok: false,
            status: e2.status || 500,
            data: e2.data || { error: e2.message },
            extracted: { isSuccess: false, address: null },
    });
    } finally {
        setLoadingDeposit(false);
    }

  };

  const runIncreaseEstimate = async (e) => {
    e?.preventDefault?.();
    setIncreaseErr(null);
    setIncreaseOut(null);
    setIncreaseFlowErr("");
    setIncreaseFlowOut(null);

    const id = loanIdFromUrl.trim();
    const amount = String(increaseAmount || "").trim();

    if (!id) {
      setIncreaseErr("Missing loanId");
      return;
    }
    if (!amount) {
      setIncreaseErr("Missing amount");
      return;
    }

    setLoadingIncrease(true);
    try {
        const j = await getIncreaseEstimate(id, amount); // <-- service

        const isSuccess = j?.result === true;

        const liquidationPrice = isSuccess ? j?.response?.liquidation_price ?? null : null;
        const precision = isSuccess ? j?.response?.precision ?? null : null;
        const realIncreaseAmount = isSuccess ? j?.response?.real_increase_amount ?? null : null;
        const newAmount = isSuccess ? j?.response?.deposit?.new_amount ?? null : null;

    setIncreaseOut({
        ok: true,
        status: 200,
        data: j,
        extracted: {
        isSuccess,
        liquidationPrice,
        precision,
        amount,
        realIncreaseAmount,
        newAmount,
        },
    });
    } catch (e2) {
        setIncreaseErr(e2.message);
        setIncreaseOut({
            ok: false,
            status: e2.status || 500,
            data: e2.data || { error: e2.message },
    });
    } finally {
        setLoadingIncrease(false);
    }
  };

  const runConfirmIncrease = async () => {
    setIncreaseFlowErr("");
    setIncreaseFlowOut(null);

    const id = loanIdFromUrl.trim();
    if (!loanId) {
      setIncreaseFlowErr("Missing loanId");
      return;
    }

    const can = increaseOut?.data?.result === true;
    if (!can) {
      setIncreaseFlowErr("Run increase estimate first");
      return;
    }

    const real = increaseOut?.data?.response?.real_increase_amount;
    const amountToUse = String(real ?? increaseAmount ?? "").trim();
    if (!amountToUse) {
      setIncreaseFlowErr("Missing amount");
      return;
    }

    try {
      const res = await runIncreaseFlow({
        loanId,
        amount: amountToUse,
      });

      setIncreaseFlowOut(res);
      setStartListen(true);


    } catch (e) {
      setIncreaseFlowErr(e?.message || "Confirm increase failed");
    }
  };

  const boxStyle = {
    borderTop: "1px solid #ddd",
    paddingTop: 16,
    display: "grid",
    gap: 8,
  };

  const increaseReady = increaseOut?.data?.result === true;

  return (
    <div style={{ padding: 20, display: "grid", gap: 18, maxWidth: 480 }}>
      <button
        type="button"
        onClick={() => setShowAdvanced((s) => !s)}
        style={{
          padding: '10px 18px',
          background: 'var(--color-primary-500)',
          color: '#222',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
          marginBottom: 8,
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)'
        }}
      >
        {showAdvanced ? "Hide advanced" : "Show advanced"}
      </button>

      {showAdvanced && (
        <div style={{ ...boxStyle, background: '#f8fff0', borderRadius: 10, border: '1.5px solid #a0ff2f' }}>
          <h3 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>Refresh deposit address, Update expired deposit transaction (Fallback)</h3>
          <form onSubmit={runRefreshDeposit} style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="submit"
              disabled={loadingDeposit || !refreshLoanId.trim()}
              style={{
                padding: '10px 18px',
                background: 'var(--color-primary-500)',
                color: '#222',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                cursor: loadingDeposit || !refreshLoanId.trim() ? 'not-allowed' : 'pointer',
                opacity: loadingDeposit || !refreshLoanId.trim() ? 0.6 : 1,
                boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)'
              }}
            >
              {loadingDeposit ? "Calling..." : "RefreshDeposit"}
            </button>
          </form>

          {depositOut?.extracted?.isSuccess && (
            <div style={{ padding: 10, border: "1px solid #cfc", background: "#f6fff6", borderRadius: 8, marginTop: 8 }}>
              <div>
                <b>OK:</b> deposit address returned
              </div>
              <div>
                <b>address:</b> {depositOut.extracted.address}
              </div>
            </div>
          )}

          {depositOut && <pre>{JSON.stringify(depositOut, null, 2)}</pre>}
          {depositErr && <pre style={{ color: "red" }}>{depositErr}</pre>}
        </div>
      )}

      <div style={{ ...boxStyle, background: '#f3f4f6', borderRadius: 10, border: '1.5px solid #a0ff2f' }}>
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>Increase (estimate → confirm)</h3>
        <form
          onSubmit={runIncreaseEstimate}
          style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}
        >
          <input
            value={increaseAmount}
            onChange={(e) => setIncreaseAmount(e.target.value)}
            placeholder="amount (e.g. 0.001)"
            style={{
              width: 180,
              padding: '10px 12px',
              border: '1.5px solid #a0ff2f',
              borderRadius: 8,
              fontSize: 16,
              outline: 'none',
              background: 'var(--background)',
              color: 'var(--foreground)',
              boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)'
            }}
          />
          <button
            type="submit"
            disabled={loadingIncrease || !loanIdFromUrl.trim()}
            style={{
              padding: '10px 18px',
              background: 'var(--color-primary-500)',
              color: '#222',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              cursor: loadingIncrease || !loanIdFromUrl.trim() ? 'not-allowed' : 'pointer',
              opacity: loadingIncrease || !loanIdFromUrl.trim() ? 0.6 : 1,
              boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)'
            }}
          >
            {loadingIncrease ? "Loading..." : "GetIncreaseEstimate"}
          </button>
          <button
            type="button"
            onClick={runConfirmIncrease}
            disabled={!increaseReady || increaseFlowLoading}
            style={{
              padding: '10px 18px',
              background: '#eee',
              color: '#444',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 16,
              cursor: !increaseReady || increaseFlowLoading ? 'not-allowed' : 'pointer',
              opacity: !increaseReady || increaseFlowLoading ? 0.6 : 1,
              boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)'
            }}
          >
            {increaseFlowLoading ? "Opening wallet..." : "Confirm Increase"}
          </button>
        </form>
        <LoanStatusLabel loanId={loanIdFromUrl.trim()} start={startListen} />


            {increaseOut?.extracted?.isSuccess && (
            <div style={{ padding: 12, border: "1px solid #ddd", background: "#f3f4f6" }}>
                <div style={{ marginBottom: 6 }}>
                <b>requested:</b> {String(increaseOut.extracted?.amount)}
                </div>
                <div>
                <b>real_increase_amount:</b>{" "}
                {String(increaseOut.extracted?.realIncreaseAmount)}
                </div>
                <div>
                <b>new_amount:</b> {String(increaseOut.extracted?.newAmount)}
                </div>
                <div>
                <b>liquidation_price:</b>{" "}
                {String(increaseOut.extracted?.liquidationPrice)}
                </div>
                <div>
                <b>precision:</b> {String(increaseOut.extracted?.precision)}
                </div>
            </div>
            )}

            {increaseOut && !increaseOut?.extracted?.isSuccess && (
            <div style={{ padding: 12, border: "1px solid #fca5a5", background: "#fef2f2" }}>
                <b>CoinRabbit error:</b>{" "}
                {increaseOut?.data?.response?.error || "Unknown error"}
            </div>
            )}

            {(increaseFlowErr || increaseFlowHookErr) && (
            <div style={{ padding: 12, border: "1px solid #fca5a5", background: "#fef2f2" }}>
                <b>Increase flow error:</b> {increaseFlowErr || increaseFlowHookErr}
            </div>
            )}

            {!!increaseFlowTxId && (
            <div style={{ padding: 12, border: "1px solid #cfc", background: "#f6fff6" }}>
                <b>Sent:</b> <span style={{ fontFamily: "monospace" }}>{increaseFlowTxId}</span>
            </div>
            )}

            {increaseFlowOut && <pre>{JSON.stringify(increaseFlowOut, null, 2)}</pre>}
            {increaseOut && <pre>{JSON.stringify(increaseOut, null, 2)}</pre>}
            {increaseErr && <pre style={{ color: "red" }}>{increaseErr}</pre>}
        </div>
    </div>
  );
}
