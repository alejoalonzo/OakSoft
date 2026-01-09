"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { db } from "@/lib/firebaseClient";
import { doc, onSnapshot } from "firebase/firestore";
import LoanDangerZoneBar from "@/features/loan/ui/LoanDangerZoneBar";

import { getLoanById } from "@/features/loan/services/coinrabbit";

/**
 * Helpers (safe + UI-friendly)
 */
function fmtMs(ms) {
  if (typeof ms !== "number") return "-";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function fmtAmount(v, max = 6) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: max }).format(n);
}

function shortAddr(a) {
  if (!a) return "-";
  const s = String(a);
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function fmtDuration(openedMs, closedMs) {
  if (typeof openedMs !== "number" || typeof closedMs !== "number") return "-";
  const diff = closedMs - openedMs;
  if (!Number.isFinite(diff) || diff <= 0) return "-";

  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const EXPLORERS = {
  ETH: "https://etherscan.io",
  BASE: "https://basescan.org",
  ARBITRUM: "https://arbiscan.io",
  OPTIMISM: "https://optimistic.etherscan.io",
  POLYGON: "https://polygonscan.com",
  BSC: "https://bscscan.com",
  AVALANCHE: "https://snowtrace.io",
  LINEA: "https://lineascan.build",
  SCROLL: "https://scrollscan.com",
  GNOSIS: "https://gnosisscan.io",
};

function addrUrl(network, address) {
  const net = String(network || "").toUpperCase();
  const base = EXPLORERS[net];
  if (!base || !address) return null;
  return `${base}/address/${address}`;
}

export default function Page() {
  const params = useParams();
  const loanId = String(params?.id || "").trim();

  const [docData, setDocData] = useState(null);
  const [phase, setPhase] = useState(null);
  const [status, setStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const didRefreshZoneRef = useRef(false);

  const isActive = phase === "ACTIVE";

  useEffect(() => {
    if (!loanId) return;
    if (!isActive) return;
    if (didRefreshZoneRef.current) return;

    let cancelled = false;

    const run = async (tries = 0) => {
      try {
        await getLoanById(loanId);
        didRefreshZoneRef.current = true; 
      } catch (e) {
        const msg = String(e?.message || "");
        if (!cancelled && msg.includes("No logged in user") && tries < 8) {
          setTimeout(() => run(tries + 1), 350);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [loanId, isActive]);

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
          setDocData(null);
          setPhase(null);
          setStatus(null);
          setLoading(false);
          return;
        }

        const d = snap.data() || {};
        setDocData(d);

        const ph = d.phase || null;
        const st = d.status || d.coinrabbit?.status || null;

        setPhase(ph);
        setStatus(st);
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

  
  const isClosedLike =
    phase === "CLOSED" ||
    phase === "LIQUIDATED" ||
    String(status || "").toLowerCase().includes("closed") ||
    String(status || "").toLowerCase().includes("liquidat");

  /**
   * Build a CLOSED summary from your Firestore doc structure
   * (the exact shape you pasted).
   */
  const closedSummary = useMemo(() => {
    if (!docData) return null;

    const borrow = docData.borrow || {};
    const deposit = docData.deposit || {};
    const confirm = docData.confirm || {};
    const cr = docData.coinrabbit || {};
    const rp = docData.requestPayload || {};

    const ltvRaw = rp?.loan?.ltv_percent ?? null;
    const ltvPct =
      ltvRaw !== null && ltvRaw !== undefined && ltvRaw !== ""
        ? Number(ltvRaw) * 100
        : null;

    // Times: you have createdAt + updatedAt in ms. confirmedAt also exists.
    const openedAtMs = docData.createdAt ?? null;
    const closedAtMs = docData.updatedAt ?? null;
    const confirmedAtMs = confirm.confirmedAt ?? null;

    const collateralNetwork = deposit.currency_network || rp?.deposit?.currency_network || null;
    const borrowNetwork = borrow.currency_network || rp?.loan?.currency_network || null;

    const payoutAddress = confirm.payoutAddress || null;
    const depositAddress = cr.depositAddress || null;

    // Prefer BASE/borrow network for explorer links (payout on loan network)
    const payoutExplorer = addrUrl(borrowNetwork, payoutAddress);
    const depositExplorer = addrUrl(collateralNetwork, depositAddress);

    return {
      phase: docData.phase || "-",
      status: docData.status || cr.status || "-",

      openedAtMs,
      closedAtMs,
      confirmedAtMs,
      duration: fmtDuration(openedAtMs, closedAtMs),

      collateralAmount: deposit.expected_amount || rp?.deposit?.expected_amount || null,
      collateralCode: deposit.currency || rp?.deposit?.currency_code || null,
      collateralNetwork,

      borrowAmount: borrow.expected_amount || rp?.loan?.expected_amount || null,
      borrowCode: borrow.currency || rp?.loan?.currency_code || null,
      borrowNetwork,

      ltvPct,

      payoutAddress,
      payoutExplorer,

      depositAddress,
      depositExplorer,

      depositTxStatus: cr.depositTxStatus || null,
      lastSyncedAt: cr.lastSyncedAt ?? docData.coinrabbit?.lastSyncedAt ?? null,
    };
  }, [docData]);

  const btnStyle = (primary) => ({
    display: "inline-block",
    padding: "10px 18px",
    background: primary ? "var(--color-primary-500)" : "#eee",
    color: primary ? "#222" : "#444",
    borderRadius: 8,
    fontWeight: primary ? 600 : 500,
    fontSize: 16,
    textDecoration: "none",
  });

  return (
    <div style={{ padding: 20, display: "grid", gap: 12, maxWidth: 460 }}>
      <h2 style={{ fontWeight: 700, fontSize: 22 }}>Loan {loanId || "-"}</h2>

      {loading && <div style={{ fontSize: 12, color: "#666" }}>Loading…</div>}
      {err && <div style={{ fontSize: 12, color: "red" }}>{err}</div>}

      {!loading && !err && (
        <div style={{ fontSize: 12, color: "#666" }}>
          phase: {phase || "-"} | status: {status || "-"}
        </div>
      )}

      {/* ACTIVE: danger zone bar */}
      {!loading && !err && isActive && (
        <LoanDangerZoneBar zone={docData?.coinrabbit?.currentZone} />
      )}

      {/* ACTIVE: show actions */}
      {!loading && !err && isActive && (
        <>
          <Link
            href={`/dashboard/loans/${encodeURIComponent(loanId)}/increase`}
            style={btnStyle(true)}
          >
            Increase
          </Link>

          <Link
            href={`/dashboard/loans/${encodeURIComponent(loanId)}/pledge`}
            style={btnStyle(false)}
          >
            Pledge
          </Link>
        </>
      )}

      {/* CLOSED / LIQUIDATED: no buttons, show summary */}
      {!loading && !err && !isActive && isClosedLike && closedSummary && (
        <div
          style={{
            border: "1px solid #222",
            borderRadius: 12,
            padding: 16,
            background: "#23272f",
            display: "grid",
            gap: 14,
            color: "#f3f3f3",
            boxShadow: "0 2px 12px 0 rgba(0,0,0,0.10)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>Final summary</div>

          <div style={{ fontSize: 14, lineHeight: 1.5, color: "#e0e0e0" }}>
            <b style={{ color: "#fff" }}>Opened:</b> {fmtMs(closedSummary.openedAtMs)} <br />
            <b style={{ color: "#fff" }}>Closed:</b> {fmtMs(closedSummary.closedAtMs)}{" "}
            <span style={{ color: "#b0b0b0" }}>{closedSummary.duration !== "-" ? `(${closedSummary.duration})` : ""}</span>
            <br />
            <b style={{ color: "#fff" }}>Confirmed:</b> {fmtMs(closedSummary.confirmedAtMs)}
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.5, color: "#e0e0e0" }}>
            <b style={{ color: "#fff" }}>Collateral:</b>{" "}
            {fmtAmount(closedSummary.collateralAmount)} {closedSummary.collateralCode || "-"}{" "}
            <span style={{ color: "#b0b0b0" }}>({closedSummary.collateralNetwork || "-"})</span>
            <br />
            <b style={{ color: "#fff" }}>Borrow:</b>{" "}
            {fmtAmount(closedSummary.borrowAmount)} {closedSummary.borrowCode || "-"}{" "}
            <span style={{ color: "#b0b0b0" }}>({closedSummary.borrowNetwork || "-"})</span>
            <br />
            <b style={{ color: "#fff" }}>LTV:</b>{" "}
            {Number.isFinite(closedSummary.ltvPct) ? `${fmtAmount(closedSummary.ltvPct, 2)}%` : "-"}
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.5, color: "#e0e0e0" }}>
            <b style={{ color: "#fff" }}>Payout address:</b>{" "}
            {closedSummary.payoutAddress ? (
              closedSummary.payoutExplorer ? (
                <a href={closedSummary.payoutExplorer} target="_blank" rel="noreferrer" style={{ color: "#7ec4fa", textDecoration: "underline" }}>
                  {shortAddr(closedSummary.payoutAddress)}
                </a>
              ) : (
                shortAddr(closedSummary.payoutAddress)
              )
            ) : (
              "-"
            )}
            <br />
            <b style={{ color: "#fff" }}>Deposit address:</b>{" "}
            {closedSummary.depositAddress ? (
              closedSummary.depositExplorer ? (
                <a href={closedSummary.depositExplorer} target="_blank" rel="noreferrer" style={{ color: "#7ec4fa", textDecoration: "underline" }}>
                  {shortAddr(closedSummary.depositAddress)}
                </a>
              ) : (
                shortAddr(closedSummary.depositAddress)
              )
            ) : (
              "-"
            )}
          </div>

          <div style={{ fontSize: 13, color: "#b0b0b0", lineHeight: 1.4 }}>
            <b style={{ color: "#fff" }}>Deposit tx status:</b> {closedSummary.depositTxStatus || "-"}
            <br />
            <b style={{ color: "#fff" }}>Last synced:</b> {fmtMs(closedSummary.lastSyncedAt)}
          </div>
        </div>
      )}

      {/* Not ACTIVE and not CLOSED: (e.g. waiting deposit) */}
      {!loading && !err && !isActive && !isClosedLike && (
        <div style={{ fontSize: 12, color: "#666" }}>
          This loan is not active yet. Please wait for deposit confirmation.
        </div>
      )}

      <Link href="/dashboard/loans" style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
        ← Back
      </Link>
    </div>
  );
}
