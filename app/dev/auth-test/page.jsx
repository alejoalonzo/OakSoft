"use client";
import { useState } from "react";
import { getIdToken } from "@/features/loan/services/session";
import CreateLoanTest from "./CreateLoanTest";

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

  function looksExpired(data) {
    try {
      const s = JSON.stringify(data).toLowerCase();
      if (s.includes("expired")) return true;

      // Heuristics for common timestamp keys
      const now = Date.now();
      const candidates = ["expires_at", "expired_at", "deadline", "valid_until"];

      const stack = [data];
      while (stack.length) {
        const cur = stack.pop();
        if (!cur || typeof cur !== "object") continue;

        for (const [k, v] of Object.entries(cur)) {
          const key = String(k).toLowerCase();

          if (candidates.includes(key)) {
            // number: could be seconds or ms
            if (typeof v === "number") {
              const ms = v < 10_000_000_000 ? v * 1000 : v;
              if (ms > 0 && ms < now) return true;
            }
            // string: ISO date
            if (typeof v === "string") {
              const t = Date.parse(v);
              if (!Number.isNaN(t) && t < now) return true;
            }
          }

          if (v && typeof v === "object") stack.push(v);
        }
      }
    } catch {
      // ignore
    }
    return false;
  }

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
      setLoanOut({
        ...res,
        extracted: {
          expiredGuess: looksExpired(res.data),
        },
      });
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

  return (
    <div style={{ padding: 20, display: "grid", gap: 18, maxWidth: 980 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <button onClick={runAuth}>Try AUTH</button>
        {out && <pre>{JSON.stringify(out, null, 2)}</pre>}
        {err && <pre style={{ color: "red" }}>{err}</pre>}
      </div>

      <div style={{ borderTop: "1px solid #ddd", paddingTop: 16, display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Get loan by id (to find expired)</h3>

        <form onSubmit={runGetLoanById} style={{ display: "flex", gap: 8 }}>
          <input
            value={checkLoanId}
            onChange={(e) => setCheckLoanId(e.target.value)}
            placeholder="Paste loanId (from Firestore) to inspect CoinRabbit status"
            style={{ flex: 1, padding: 10 }}
          />
          <button type="submit" disabled={loadingLoan || !checkLoanId.trim()}>
            {loadingLoan ? "Loading..." : "GetLoanById"}
          </button>
        </form>

        {loanOut?.extracted && (
          <div style={{ padding: 10, border: "1px solid #ddd", background: "#fafafa" }}>
            <b>expiredGuess:</b> {String(loanOut.extracted.expiredGuess)}
            <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>
              Tip: busca en el JSON campos como <code>expired</code>, <code>expires_at</code>, <code>deadline</code>.
            </div>
          </div>
        )}

        {loanOut && <pre>{JSON.stringify(loanOut, null, 2)}</pre>}
        {loanErr && <pre style={{ color: "red" }}>{loanErr}</pre>}
      </div>

      <div style={{ borderTop: "1px solid #ddd", paddingTop: 16, display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Refresh deposit address (Update expired deposit transaction)</h3>

        <form onSubmit={runRefreshDeposit} style={{ display: "flex", gap: 8 }}>
          <input
            value={refreshLoanId}
            onChange={(e) => setRefreshLoanId(e.target.value)}
            placeholder="Paste an expired loanId here, then refresh deposit address"
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

      <div style={{ borderTop: "1px solid #ddd", paddingTop: 16 }}>
        <CreateLoanTest />
      </div>
    </div>
  );
}
