"use client";
import { useState } from "react";
import { getIdToken } from "@/features/loan/services/session";
import CreateLoanTest from "./CreateLoanTest";

export default function AuthTest() {
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);

  const run = async () => {
    setErr(null); setOut(null);
    try {
      const t = await getIdToken();
      const r = await fetch("/api/coinrabbit/auth", {
        headers: { Authorization: "Bearer " + t },
      });

      const ct = r.headers.get("content-type") || "";
      const txt = await r.text();
      let data = ct.includes("application/json")
        ? (()=>{ try { return JSON.parse(txt); } catch { return { raw: txt }; } })()
        : { raw: txt };

      setOut({ status: r.status, data });
    } catch (e) {
      setErr(e.message);
    }
  };


  return (
    <div style={{padding:20}}>
      <button onClick={run}>Try AUTH</button>
      {out && <pre>{JSON.stringify(out, null, 2)}</pre>}
      {err && <pre style={{color:"red"}}>{err}</pre>}

      <CreateLoanTest />
    </div>
  );
}
