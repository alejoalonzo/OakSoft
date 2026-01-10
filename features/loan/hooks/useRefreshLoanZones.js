"use client";

import { useEffect, useRef } from "react";
import { getLoanById } from "@/features/loan/services/coinrabbit";

export default function useRefreshLoanZones({
  loans = [],
  enabled = true,
  limit = 10,
  onlyIfMissing = true,
  maxRetries = 12, // ~attempts per loan
  retryMs = 600, // base delay
  entryKey = "", // we respect it, but you are not forced to use it
} = {}) {
  const inFlightRef = useRef(new Set());
  const triesRef = useRef(new Map()); // loanId -> tries
  const timersRef = useRef(new Map()); // loanId -> timeoutId
  const prevKeyRef = useRef(null);
  const loansRef = useRef(loans);

  useEffect(() => {
    loansRef.current = loans;
  }, [loans]);

  useEffect(() => {
    // Reset when entering another page/context
    if (prevKeyRef.current !== entryKey) {
      prevKeyRef.current = entryKey;

      inFlightRef.current = new Set();
      triesRef.current = new Map();

      // clear timers
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current = new Map();
    }

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

    const hasZoneNowInSnapshot = loanId => {
      const arr = loansRef.current || [];
      const l = arr.find(
        x => String(x?.loanId || x?.id || "").trim() === loanId
      );
      const z = l?.coinrabbit?.currentZone;
      return z !== null && z !== undefined;
    };

    const schedule = (loanId, nextTries) => {
      if (cancelled) return;
      if (nextTries > maxRetries) return;

      // avoid duplicating timers
      if (timersRef.current.has(loanId)) return;

      const backoff = Math.min(
        retryMs * Math.pow(1.6, Math.max(0, nextTries - 1)),
        8000
      );

      const tid = setTimeout(() => {
        timersRef.current.delete(loanId);
        refreshOne(loanId);
      }, backoff);

      timersRef.current.set(loanId, tid);
    };

    const refreshOne = async loanId => {
      if (cancelled) return;
      if (!loanId) return;

      // if it already appeared in snapshot, stop
      if (hasZoneNowInSnapshot(loanId)) {
        triesRef.current.delete(loanId);
        const t = timersRef.current.get(loanId);
        if (t) clearTimeout(t);
        timersRef.current.delete(loanId);
        return;
      }

      // attempt limit
      const prev = triesRef.current.get(loanId) || 0;
      const next = prev + 1;
      triesRef.current.set(loanId, next);
      if (next > maxRetries) return;

      // avoid parallel duplicates
      if (inFlightRef.current.has(loanId)) return;
      inFlightRef.current.add(loanId);

      try {
        await getLoanById(loanId);
        // IMPORTANT: even if "ok", we wait for Firestore to reflect the change
        // and if it's still not there, we retry.
        if (!hasZoneNowInSnapshot(loanId)) {
          schedule(loanId, next);
        }
      } catch (e) {
        // Retry on typical auth/network errors
        const msg = String(e?.message || "");
        const retryable =
          msg.includes("No logged in user") ||
          msg.includes("Failed to fetch") ||
          msg.includes("NetworkError") ||
          msg.includes("timeout") ||
          msg.includes("429") ||
          msg.includes("503");

        if (retryable) schedule(loanId, next);
        else console.error("Zone refresh failed:", loanId, e);
      } finally {
        inFlightRef.current.delete(loanId);
      }
    };

    // trigger attempts for candidates
    for (const l of candidates) {
      const loanId = String(l.loanId || l.id || "").trim();
      refreshOne(loanId);
    }

    return () => {
      cancelled = true;
    };
  }, [enabled, loans, limit, onlyIfMissing, maxRetries, retryMs, entryKey]);
}
