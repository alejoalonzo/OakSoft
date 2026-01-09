"use client";

import { useEffect, useRef } from "react";
import { getLoanById } from "@/features/loan/services/coinrabbit";

export default function useRefreshLoanZones({
  loans = [],
  enabled = true,
  limit = 10,
  onlyIfMissing = true,
  maxRetries = 8,
  retryMs = 350,
} = {}) {
  // done = refreshed successfully
  const doneRef = useRef(new Set());
  // inFlight = currently refreshing
  const inFlightRef = useRef(new Set());

  useEffect(() => {
    if (!enabled) return;
    if (!Array.isArray(loans) || loans.length === 0) return;

    const candidates = loans
      .filter(l => l?.phase === "ACTIVE")
      .filter(l => {
        if (!onlyIfMissing) return true;
        const z = l?.coinrabbit?.currentZone;
        return z === null || z === undefined;
      })
      .slice(0, Math.max(1, Number(limit) || 10));

    if (candidates.length === 0) return;

    let cancelled = false;

    const refreshOne = async (loanId, tries = 0) => {
      if (cancelled) return;
      if (!loanId) return;

      // already done
      if (doneRef.current.has(loanId)) return;

      // prevent parallel duplicates
      if (inFlightRef.current.has(loanId)) return;
      inFlightRef.current.add(loanId);

      try {
        await getLoanById(loanId); // this updates Firestore via API route
        doneRef.current.add(loanId); // mark done ONLY on success
      } catch (e) {
        const msg = String(e?.message || "");

        // Firebase/Auth not ready yet => retry like pledge page
        if (
          !cancelled &&
          msg.includes("No logged in user") &&
          tries < maxRetries
        ) {
          setTimeout(() => refreshOne(loanId, tries + 1), retryMs);
          return;
        }

        console.error("Zone refresh failed:", loanId, e);
      } finally {
        inFlightRef.current.delete(loanId);
      }
    };

    candidates.forEach(l => {
      const loanId = String(l.loanId || l.id || "").trim();
      refreshOne(loanId);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, loans, limit, onlyIfMissing, maxRetries, retryMs]);
}
