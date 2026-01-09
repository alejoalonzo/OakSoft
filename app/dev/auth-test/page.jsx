"use client";

import { useState } from "react";
import { getIdToken } from "@/features/loan/services/session";
import LoanStatusLabel from "@/features/loan/ui/LoanStatusLabel";
import { useIncreaseAndPayCollateral } from "@/features/loan/hooks/useIncreaseAndPayCollateral";

export default function AuthTest() {
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);

  const [checkLoanId, setCheckLoanId] = useState("");
  const [loadingLoan, setLoadingLoan] = useState(false);

  // Agregamos los estados para la respuesta y el error del get loan by id
  const [loanOut, setLoanOut] = useState(null);
  const [loanErr, setLoanErr] = useState(null);

  const [refreshLoanId, setRefreshLoanId] = useState("");

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

  const boxStyle = {
    borderTop: "1px solid #ddd",
    paddingTop: 16,
    display: "grid",
    gap: 8,
  };

  return (
    <div style={{ padding: 20, display: "grid", gap: 18, maxWidth: 980 }}>

      <div style={boxStyle}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Get loan by id</h3>
        <form onSubmit={runGetLoanById} style={{ display: "flex", gap: 8 }}>
          <input
            value={checkLoanId}
            onChange={(e) => setCheckLoanId(e.target.value)}
            placeholder="Loan id"
            style={{
              flex: 1,
              padding: "12px 14px",
              border: "2px solid #1976d2",
              borderRadius: 6,
              fontSize: 16,
              outline: "none",
              background: "#f9f9f9",
              color: "#222",
              fontWeight: 500
            }}
          />
          <button
            type="submit"
            disabled={loadingLoan || !checkLoanId.trim()}
            style={{
              padding: "12px 20px",
              background: loadingLoan ? "#bbb" : "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              cursor: loadingLoan ? "not-allowed" : "pointer",
              fontSize: 16,
              letterSpacing: 1,
              boxShadow: "0 1px 4px #0001"
            }}
          >
            {loadingLoan ? "Loading..." : "Get Loan"}
          </button>
        </form>
        {loanOut && <pre>{JSON.stringify(loanOut, null, 2)}</pre>}
        {loanErr && <pre style={{ color: "red" }}>{loanErr}</pre>}
      </div>
    </div>
  );
}
