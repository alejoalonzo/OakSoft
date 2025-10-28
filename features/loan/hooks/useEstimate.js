"use client";

import { useEffect, useRef, useState } from "react";
import { receiveNetworksOf, prioritize } from "../utils/networks";
import { getEstimate } from "../services/coinrabbit";

/**
 * Calculates the estimate with debounce, retries per alternate network
 * and backoff for 429. Keeps estLoading/estErr/estimate.
 *
 * Args:
 * - amount (string|number)
 * - selectedCollateral ({code, network})
 * - selectedBorrow ({code, network})
 * - selectedLTV ("50" | "65" | "80" | "90" | etc.)
 * - currencies (full list, to discover the networks for the token to be received)
 * - borrowList (to sync the selector if we change the network)
 * - setSelectedBorrow (widget setter, optional but recommended)
 * - debounceMs (default 400)
 * - maxTryNetworks (default 3)
 */
export default function useEstimate({
  amount,
  selectedCollateral,
  selectedBorrow,
  selectedLTV,
  currencies,
  borrowList,
  setSelectedBorrow,
  debounceMs = 400,
  maxTryNetworks = 3,
}) {
  const [estimate, setEstimate] = useState(null);
  const [estLoading, setEstLoading] = useState(false);
  const [estErr, setEstErr] = useState(null);

  // simple rate-limit backoff memory
  const last429Ref = useRef(0);

  useEffect(() => {
    if (!selectedCollateral || !selectedBorrow) return;
    if (!amount || Number(amount) <= 0) return;

    const now = Date.now();
    if (now - last429Ref.current < 60_000) {
      setEstErr("Rate limit. Try again in ~1 minute.");
      return;
    }

    const ctrl = new AbortController();

    const run = async () => {
      setEstLoading(true);
      setEstErr(null);
      setEstimate(null);

      const from = {
        code: selectedCollateral.code,
        network: selectedCollateral.network,
      };
      const to = { code: selectedBorrow.code, network: selectedBorrow.network };
      const ltvP = Number(selectedLTV) / 100;

      const allNets = receiveNetworksOf(to.code, currencies);
      const ordered = prioritize(allNets, to.network);
      const netsTry = ordered.length
        ? ordered.slice(0, maxTryNetworks)
        : [to.network];

      for (const net of netsTry) {
        const params = {
          from_code: from.code,
          from_network: from.network,
          to_code: to.code,
          to_network: net,
          amount: String(amount),
          ltv_percent: String(ltvP),
          exchange: "direct",
        };

        try {
          const j = await getEstimate(params, { signal: ctrl.signal });
          if (ctrl.signal.aborted) return;

          if (j?.result) {
            // si la red cambia, opcionalmente sincroniza el selector del widget
            if (net !== to.network && typeof setSelectedBorrow === "function") {
              const fixed = (borrowList || []).find(
                c => c.code === to.code && c.network === net
              );
              if (fixed) setSelectedBorrow(fixed);
            }
            setEstimate(j.response || null);
            setEstErr(null);
            setEstLoading(false);
            return;
          }

          const msg = (j?.message || "").toLowerCase();
          const isPairErr =
            msg.includes("pair does not exists") ||
            msg.includes("data for currency");
          if (!isPairErr) {
            setEstErr(j?.message || "Estimate failed");
            break;
          }
          // if the "pair not exists", try next network
        } catch (e) {
          if (ctrl.signal.aborted) return;

          if (e?.status === 429 || e?.originalError?.status === 429) {
            last429Ref.current = Date.now();
            setEstErr("Rate limit. Try again in ~1 minute.");
            break;
          }

          const msg = (e?.message || "").toLowerCase();
          const isPairErr =
            msg.includes("pair does not exists") ||
            msg.includes("data for currency");
          if (!isPairErr) {
            setEstErr(e?.message || "Estimate failed");
            break;
          }
        }
      }

      setEstLoading(false);
      if (!estimate) {
        setEstErr(`No available network for ${to.code} with ${from.code}.`);
      }
    };

    const t = setTimeout(run, debounceMs); // debounce
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    amount,
    selectedCollateral,
    selectedBorrow,
    selectedLTV,
    currencies,
    borrowList,
  ]);

  return { estimate, estLoading, estErr };
}
