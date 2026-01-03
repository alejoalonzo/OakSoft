"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// adjust to your setup
import { db } from "@/lib/firebaseClient";
import { doc, onSnapshot } from "firebase/firestore";

export default function Page() {
  const params = useParams();
  const loanId = String(params?.id || "").trim();

  const [phase, setPhase] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!loanId) {
      setLoading(false);
      setErr("Missing loanId");
      return;
    }

    setLoading(true);
    setErr("");

    const ref = doc(db, "loans", loanId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setErr("Loan not found");
          setPhase(null);
          setStatus(null);
          setLoading(false);
          return;
        }

        const d = snap.data() || {};
        setPhase(d.phase || null);
        setStatus(d.status || d.coinrabbit?.status || null);
        setLoading(false);
      },
      (e) => {
        console.error("LOAN DOC SNAPSHOT ERROR:", e);
        setErr(e?.message || "Snapshot error");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [loanId]);

  const isActive = phase === "ACTIVE";

  const btnStyle = (enabled, primary) => ({
    display: "inline-block",
    padding: "10px 18px",
    background: primary ? "var(--color-primary-500)" : "#eee",
    color: primary ? "#222" : "#444",
    borderRadius: 8,
    fontWeight: primary ? 600 : 500,
    fontSize: 16,
    textDecoration: "none",
    opacity: enabled ? 1 : 0.5,
    pointerEvents: enabled ? "auto" : "none",
  });

  return (
    <div style={{ padding: 20, display: "grid", gap: 12, maxWidth: 360 }}>
      <h2 style={{ fontWeight: 600, fontSize: 22 }}>Loan {loanId || "-"}</h2>

      {loading && <div style={{ fontSize: 12, color: "#666" }}>Loading…</div>}
      {err && <div style={{ fontSize: 12, color: "red" }}>{err}</div>}

      {!loading && !err && (
        <div style={{ fontSize: 12, color: "#666" }}>
          phase: {phase || "-"} | status: {status || "-"}
        </div>
      )}

      <Link
        href={`/dashboard/loans/${encodeURIComponent(loanId)}/increase`}
        style={btnStyle(isActive, true)}
      >
        Increase
      </Link>

      <Link
        href={`/dashboard/loans/${encodeURIComponent(loanId)}/pledge`}
        style={btnStyle(isActive, false)}
      >
        Pledge
      </Link>

      {!loading && !err && !isActive && (
        <div style={{ fontSize: 12, color: "#666" }}>
          This loan is not active yet. Please wait for deposit confirmation.
        </div>
      )}
    </div>
  );
}
