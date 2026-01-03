"use client";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getIncreaseEstimate, refreshDepositAddress } from "@/features/loan/services/coinrabbit";
import LoanStatusLabel from "@/features/loan/ui/LoanStatusLabel";
import { useIncreaseAndPayCollateral } from "@/features/loan/hooks/useIncreaseAndPayCollateral";

export default function IncreaseLoan({ loanId }) {
  const loanIdFromUrl = String(loanId || "").trim();

    const router = useRouter();
  
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
        loanId: id,
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
      ← Back to My Loans
    </button>
    <div style={{ fontSize: 12, color: "#666" }}>
      If the deposit gets stuck or the address expires, you can{" "}
      <span
        onClick={() => setShowAdvanced((s) => !s)}
        style={{
          color: "var(--color-primary-500)",
          cursor: "pointer",
          fontWeight: 600,
          textDecoration: "underline",
        }}
      >
        refresh the deposit address
      </span>
      .
    </div>

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

          {depositErr && <pre style={{ color: "red" }}>{depositErr}</pre>}
        </div>
      )}

      <div style={{ ...boxStyle, background: '#f3f4f6', borderRadius: 12, border: '1.5px solid #a0ff2f', boxShadow: '0 2px 12px 0 rgba(160,255,47,0.08)', padding: 24, marginTop: 12 }}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 20, color: '#222' }}>Increase (estimate → confirm)</h3>
        
        <div style={{ fontSize: 12, color: "#666" }}>
          loanIdFromUrl: <b>{loanIdFromUrl || "(empty)"}</b>
        </div>


        <form
          onSubmit={runIncreaseEstimate}
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            alignItems: "center",
            background: '#fff',
            borderRadius: 10,
            padding: '18px 16px',
            marginTop: 16,
            boxShadow: '0 1px 6px 0 rgba(0,0,0,0.04)'
          }}
        >
          <input
            value={increaseAmount}
            onChange={(e) => setIncreaseAmount(e.target.value)}
            placeholder="amount (e.g. 0.001)"
            style={{
              width: 180,
              padding: '12px 14px',
              border: '2px solid #a0ff2f',
              borderRadius: 8,
              fontSize: 17,
              outline: 'none',
              background: '#f8fff0',
              color: '#222',
              fontWeight: 500,
              boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)'
            }}
          />
          <button
            type="submit"
            disabled={loadingIncrease || !loanIdFromUrl.trim()}
            style={{
              padding: '12px 22px',
              background: 'var(--color-primary-500)',
              color: '#222',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: 0.5,
              cursor: loadingIncrease || !loanIdFromUrl.trim() ? 'not-allowed' : 'pointer',
              opacity: loadingIncrease || !loanIdFromUrl.trim() ? 0.6 : 1,
              boxShadow: '0 2px 8px 0 rgba(160,255,47,0.10)'
            }}
          >
            {loadingIncrease ? "Loading..." : "Get Increase Estimate"}
          </button>
          <button
            type="button"
            onClick={runConfirmIncrease}
            disabled={!increaseReady || increaseFlowLoading}
            style={{
              padding: '12px 22px',
              background: '#eee',
              color: '#444',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 17,
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
          <div
            style={{
              padding: 18,
              border: "2px solid #a0ff2f",
              background: "#fff",
              borderRadius: 10,
              marginTop: 18,
              marginBottom: 8,
              boxShadow: '0 2px 12px 0 rgba(160,255,47,0.08)',
              color: '#1a1a1a',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <b>Requested:</b> <span style={{ color: '#222' }}>{String(increaseOut.extracted?.amount)}</span>
            </div>
            <div>
              <b>Real increase amount:</b> <span style={{ color: '#222' }}>{String(increaseOut.extracted?.realIncreaseAmount)}</span>
            </div>
            <div>
              <b>New amount:</b> <span style={{ color: '#222' }}>{String(increaseOut.extracted?.newAmount)}</span>
            </div>
            <div>
              <b>Liquidation price:</b> <span style={{ color: '#222' }}>{String(increaseOut.extracted?.liquidationPrice)}</span>
            </div>
            <div>
              <b>Precision:</b> <span style={{ color: '#222' }}>{String(increaseOut.extracted?.precision)}</span>
            </div>
          </div>
        )}

        {increaseOut && !increaseOut?.extracted?.isSuccess && (
          <div
            style={{
              padding: 18,
              border: "2px solid #f87171",
              background: "#fff",
              borderRadius: 10,
              marginTop: 18,
              marginBottom: 8,
              boxShadow: '0 2px 12px 0 rgba(248,113,113,0.08)',
              color: '#b91c1c',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <b>CoinRabbit error:</b> <span style={{ color: '#b91c1c' }}>{increaseOut?.data?.response?.error || "Unknown error"}</span>
            </div>
            <pre style={{ background: '#fef2f2', color: '#222', borderRadius: 6, padding: 10, fontSize: 14, margin: 0, overflowX: 'auto' }}>{JSON.stringify(increaseOut?.data, null, 2)}</pre>
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
            {increaseErr && <pre style={{ color: "red" }}>{increaseErr}</pre>}
        </div>
    </div>
  );
}
