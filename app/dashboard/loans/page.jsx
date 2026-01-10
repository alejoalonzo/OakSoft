"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import LoanZonePill from "@/features/loan/ui/LoanZonePill";
import useRefreshLoanZones from "@/features/loan/hooks/useRefreshLoanZones";
import { usePathname } from "next/navigation";


export default function Page() {
  const router = useRouter();

  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyErr, setHistoryErr] = useState("");

  const [snapErr, setSnapErr] = useState("");
  const pathname = usePathname();

  const [entryKey, setEntryKey] = useState(0);

  useEffect(() => {
    setEntryKey((k) => k + 1); // increment to signal a new entry
  }, []);

  // Refresh loan zones
  useRefreshLoanZones({
    loans,
    enabled: !!uid,
    limit: 10,
    onlyIfMissing: false,
    entryKey: pathname,
  });

  // 1) Detect user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid || null);
    });
    return () => unsub();
  }, []);

  // 2) Subscribe to ACTIVE loans
  useEffect(() => {
    if (!uid) {
      setLoans([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "loans"),
      where("uid", "==", uid),
      where("phase", "==", "ACTIVE"),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setLoans(items);
        setSnapErr("");
        setLoading(false);
      },
      (err) => {
        console.error("LOANS SNAPSHOT ERROR:", err);
        setSnapErr(err?.message || "Snapshot error");
        setLoading(false);
      }
      
    );

    return () => unsub();
  }, [uid]);

  // 3) Subscribe to CLOSED/LIQUIDATED loans (history)
  useEffect(() => {
    if (!uid) {
      setHistory([]);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);

    const qh = query(
      collection(db, "loans"),
      where("uid", "==", uid),
      where("phase", "in", ["CLOSED", "LIQUIDATED"]),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(
      qh,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setHistory(items);
        setHistoryErr("");
        setLoadingHistory(false);
      },
      (err) => {
        console.error("HISTORY SNAPSHOT ERROR:", err);
        setHistoryErr(err?.message || "Snapshot error");
        setLoadingHistory(false);
      }
    );

    return () => unsub();
  }, [uid]);


  return (
    <div style={{ padding: 20, display: "grid", gap: 16, maxWidth: 520 }}>
      <h2 style={{ fontWeight: 600, fontSize: 22, marginBottom: 4 }}>My active loans</h2>

      {!uid && <div style={{ fontSize: 14, color: "#666" }}>Please log in.</div>}

      {uid && loading && <div style={{ fontSize: 14, color: "#666" }}>Loading...</div>}

      {snapErr && <div style={{ color: "red", fontSize: 12 }}>{snapErr}</div>}

      {uid && !loading && loans.length === 0 && (
        <div style={{ fontSize: 14, color: "#666" }}>No active loans yet.</div>
      )}

      {loans.map((l) => (
        <div
          key={l.id}
          style={{
            border: "1.5px solid #a0ff2f",
            borderRadius: 10,
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 600 }}>Loan {l.loanId || l.id}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              status: {l.status || l.coinrabbit?.status || "-"}
            </div>
            <LoanZonePill zone={l.coinrabbit?.currentZone} showWhenUnknown />
          </div>

          <button
            onClick={() => router.push(`/dashboard/loans/${encodeURIComponent(l.loanId || l.id)}`)}
            style={{
              padding: "10px 14px",
              background: "var(--color-primary-500)",
              color: "#222",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Open
          </button>
        </div>
      ))}

      <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0" }} />

      <h3 style={{ fontWeight: 600, fontSize: 18, margin: 0 }}>History</h3>

      {loadingHistory && <div style={{ fontSize: 14, color: "#666" }}>Loading history...</div>}
      {historyErr && <div style={{ color: "red", fontSize: 12 }}>{historyErr}</div>}

      {!loadingHistory && history.length === 0 && (
        <div style={{ fontSize: 14, color: "#666" }}>No closed loans yet.</div>
      )}

      {history.map((l) => (
        <div
          key={l.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            opacity: 0.85,
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontWeight: 600 }}>Loan {l.loanId || l.id}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              phase: {l.phase || "-"} | status: {l.status || l.coinrabbit?.status || "-"}
            </div>
          </div>

          <button
            onClick={() => router.push(`/dashboard/loans/${encodeURIComponent(l.loanId || l.id)}`)}
            style={{
              padding: "10px 14px",
              background: "#eee",
              color: "#444",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View
          </button>
        </div>
      ))}

    </div>
  );
}
