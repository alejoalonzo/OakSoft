"use client";

import { useState } from "react";
import { getIdToken } from "@/features/loan/services/session";
import CreateLoanTest from "./CreateLoanTest";
import LoanStatusLabel from "@/features/loan/ui/LoanStatusLabel";

export default function AuthTest() {
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);

  const [checkLoanId, setCheckLoanId] = useState("");
  const [loanOut, setLoanOut] = useState(null);
  const [loanErr, setLoanErr] = useState(null);
  const [loadingLoan, setLoadingLoan] = useState(false);

  const [refreshLoanId, setRefreshLoanId] = useState("");
  const [depositOut, setDepositOut] = useState(null);
  const [depositErr, setDepositErr] = useState(null);
  const [loadingDeposit, setLoadingDeposit] = useState(false);

  const [increaseLoanId, setIncreaseLoanId] = useState("");
  const [increaseAmount, setIncreaseAmount] = useState("0.001");
  const [increaseOut, setIncreaseOut] = useState(null);
  const [increaseErr, setIncreaseErr] = useState(null);
  const [loadingIncrease, setLoadingIncrease] = useState(false);

  const [listen, setListen] = useState(false);
  const [listenLoanId, setListenLoanId] = useState("");

  const parseResponse = async (r) => {
    const ct = r.headers.get("content-type") || "";
    const txt = await r.text();
    const data = ct.includes("application/json")
      ? (() => {
          try {
            return JSON.parse(txt);
          } catch {
            return { raw: txt };
          }
        })()
      : { raw: txt };

    return { status: r.status, ok: r.ok, data };
  };

  const runAuth = async () => {
    setErr(null);
    setOut(null);
    try {
      const t = await getIdToken();
      const r = await fetch("/api/coinrabbit/auth", {
        headers: { Authorization: "Bearer " + t },
      });
      const res = await parseResponse(r);
      setOut(res);
    } catch (e) {
      setErr(e.message);
    }
  };

  const runGetLoanById = async (e) => {
    e?.preventDefault?.();
    setLoanErr(null);
    setLoanOut(null);

    const id = checkLoanId.trim();
    if (!id) {
      setLoanErr("Missing loanId");
      return;
    }

    setLoadingLoan(true);
    try {
      const t = await getIdToken();
      const r = await fetch(`/api/coinrabbit/loans/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: { Authorization: "Bearer " + t },
        cache: "no-store",
      });
      const res = await parseResponse(r);
      setLoanOut(res);
    } catch (e2) {
      setLoanErr(e2.message);
    } finally {
      setLoadingLoan(false);
    }
  };

  const runRefreshDeposit = async (e) => {
    e?.preventDefault?.();
    setDepositErr(null);
    setDepositOut(null);

    const id = refreshLoanId.trim();
    if (!id) {
      setDepositErr("Missing loanId");
      return;
    }

    setLoadingDeposit(true);
    try {
      const t = await getIdToken();
      const r = await fetch(`/api/coinrabbit/deposit/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { Authorization: "Bearer " + t },
        cache: "no-store",
      });

      const res = await parseResponse(r);
      const addr = res?.data?.response?.address || null;

      setDepositOut({
        ...res,
        extracted: {
          address: addr,
          isSuccess: res.ok && res?.data?.result === true && !!addr,
        },
      });
    } catch (e2) {
      setDepositErr(e2.message);
    } finally {
      setLoadingDeposit(false);
    }
  };

  const runIncreaseEstimate = async (e) => {
    e?.preventDefault?.();
    setIncreaseErr(null);
    setIncreaseOut(null);

    const id = increaseLoanId.trim();
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
      const t = await getIdToken();
      const qs = new URLSearchParams({ amount }).toString();

      const r = await fetch(
        `/api/coinrabbit/increase/estimate/${encodeURIComponent(id)}?${qs}`,
        {
          method: "GET",
          headers: { Authorization: "Bearer " + t },
          cache: "no-store",
        }
      );

      const res = await parseResponse(r);

      const isSuccess = res?.data?.result === true;
      const max = isSuccess ? res?.data?.response?.max ?? null : null;
      const liquidationPrice = isSuccess
        ? res?.data?.response?.liquidation_price ?? null
        : null;
      const precision = isSuccess ? res?.data?.response?.precision ?? null : null;

      setIncreaseOut({
        ...res,
        extracted: { isSuccess, max, liquidationPrice, precision, amount },
      });
    } catch (e2) {
      setIncreaseErr(e2.message);
    } finally {
      setLoadingIncrease(false);
    }
  };

  const boxStyle = {
    borderTop: "1px solid #ddd",
    paddingTop: 16,
    display: "grid",
    gap: 8,
  };

  return (
    <div style={{ padding: 20, display: "grid", gap: 18, maxWidth: 980 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <button onClick={runAuth}>Try AUTH</button>
        {out && <pre>{JSON.stringify(out, null, 2)}</pre>}
        {err && <pre style={{ color: "red" }}>{err}</pre>}
      </div>

      <div style={boxStyle}>
        <h3 style={{ margin: 0 }}>Listen loan status (starts only when you click)</h3>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={listenLoanId}
            onChange={(e) => setListenLoanId(e.target.value)}
            placeholder="Paste loanId to listen"
            style={{ flex: 1, padding: 10 }}
          />
          <button type="button" onClick={() => setListen(true)} disabled={!listenLoanId.trim()}>
            Start
          </button>
          <button type="button" onClick={() => setListen(false)}>
            Stop
          </button>
        </div>

        <LoanStatusLabel loanId={listenLoanId.trim()} start={listen} />
      </div>

      <div style={boxStyle}>
        <h3 style={{ margin: 0 }}>Get loan by id</h3>
        <form onSubmit={runGetLoanById} style={{ display: "flex", gap: 8 }}>
          <input
            value={checkLoanId}
            onChange={(e) => setCheckLoanId(e.target.value)}
            placeholder="Paste loanId"
            style={{ flex: 1, padding: 10 }}
          />
          <button type="submit" disabled={loadingLoan || !checkLoanId.trim()}>
            {loadingLoan ? "Loading..." : "GetLoanById"}
          </button>
        </form>
        {loanOut && <pre>{JSON.stringify(loanOut, null, 2)}</pre>}
        {loanErr && <pre style={{ color: "red" }}>{loanErr}</pre>}
      </div>

      <div style={boxStyle}>
        <h3 style={{ margin: 0 }}>Refresh deposit address (Update expired deposit transaction)</h3>
        <form onSubmit={runRefreshDeposit} style={{ display: "flex", gap: 8 }}>
          <input
            value={refreshLoanId}
            onChange={(e) => setRefreshLoanId(e.target.value)}
            placeholder="Paste loanId"
            style={{ flex: 1, padding: 10 }}
          />
          <button type="submit" disabled={loadingDeposit || !refreshLoanId.trim()}>
            {loadingDeposit ? "Calling..." : "RefreshDeposit"}
          </button>
        </form>

        {depositOut?.extracted?.isSuccess && (
          <div style={{ padding: 10, border: "1px solid #cfc", background: "#f6fff6" }}>
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

      <div style={boxStyle}>
        <h3 style={{ margin: 0 }}>Get increase estimate</h3>

        <form onSubmit={runIncreaseEstimate} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={increaseLoanId}
            onChange={(e) => setIncreaseLoanId(e.target.value)}
            placeholder="Paste loanId"
            style={{ flex: 1, padding: 10, minWidth: 260 }}
          />

          <input
            value={increaseAmount}
            onChange={(e) => setIncreaseAmount(e.target.value)}
            placeholder="amount (e.g. 0.001)"
            style={{ width: 180, padding: 10 }}
          />

          <button type="submit" disabled={loadingIncrease || !increaseLoanId.trim()}>
            {loadingIncrease ? "Loading..." : "GetIncreaseEstimate"}
          </button>
        </form>

        {increaseOut?.extracted?.isSuccess && (
          <div style={{ padding: 12, border: "1px solid #ddd", background: "#f3f4f6" }}>
            <div style={{ marginBottom: 6 }}>
              <b>amount:</b> {String(increaseOut.extracted?.amount)}
            </div>
            <div>
              <b>max:</b> {String(increaseOut.extracted?.max)}
            </div>
            <div>
              <b>liquidation_price:</b> {String(increaseOut.extracted?.liquidationPrice)}
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

        {increaseOut && <pre>{JSON.stringify(increaseOut, null, 2)}</pre>}
        {increaseErr && <pre style={{ color: "red" }}>{increaseErr}</pre>}
      </div>

      <div style={{ borderTop: "1px solid #ddd", paddingTop: 16 }}>
        <CreateLoanTest />
      </div>
    </div>
  );
}
