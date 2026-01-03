"use client";

import { useEffect, useState } from "react";
import { validateAddress } from "@/features/loan/services/coinrabbit";

/**
 * Reusable debounced remote validation.
 * @param {{ address: string, code: string, network: string, enabled?: boolean }} args
 */
export function useValidateAddress({ address, code, network, enabled = true }) {
  const [validating, setValidating] = useState(false);
  const [valid, setValid] = useState(null); // null | true | false
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;

    const a = String(address || "").trim();
    const c = String(code || "").trim();
    const n = String(network || "").trim();

    if (!a) {
      setError("");
      setValid(null);
      setValidating(false);
      return;
    }

    if (!c || !n) return;

    const controller = new AbortController();

    const t = setTimeout(async () => {
      setValidating(true);
      setError("");

      try {
        const res = await validateAddress(a, c, n, null, {
          signal: controller.signal,
        });
        setValid(!!res?.valid);
        setError(res?.valid ? "" : "Invalid address for this network");
      } catch (e) {
        if (controller.signal.aborted) return;
        setValid(false);
        setError("Invalid address for this network");
      } finally {
        if (!controller.signal.aborted) setValidating(false);
      }
    }, 500);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [address, code, network, enabled]);

  return { validating, valid, error };
}
