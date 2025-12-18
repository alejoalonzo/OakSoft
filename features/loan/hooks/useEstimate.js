"use client";

import { useEffect, useRef, useState } from "react";
import { receiveNetworksOf, prioritize } from "../utils/networks";
import { getEstimate } from "../services/coinrabbit";

/**
 * Formatea mensajes de error de la API para hacerlos más legibles
 */
function formatErrorMessage(message) {
  if (!message) return "Estimate failed";

  // Detectar mensaje de "calculated amount is less than min amount"
  const minAmountRegex =
    /The calculated amount ([\d.]+) (\w+) \[[\w-]+\] is less than min amount ([\d.]+) (\w+) \[[\w-]+\]/i;
  const match = message.match(minAmountRegex);

  if (match) {
    const [, calcAmount, currency1, minAmount, currency2] = match;
    const calc = Number(calcAmount);
    const min = Number(minAmount);

    // Formatear números: si es mayor a 1, mostrar 2 decimales, si es menor mostrar hasta 6
    const formatNum = num => {
      if (num >= 1) return num.toFixed(2);
      if (num >= 0.01) return num.toFixed(4);
      return num.toFixed(6);
    };

    return `Amount ${formatNum(calc)} ${currency1.toUpperCase()} is below minimum of ${formatNum(min)} ${currency2.toUpperCase()}`;
  }

  // Para otros mensajes, solo limpiar corchetes si existen
  return message.replace(/\[[\w-]+\]/g, "").trim();
}

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

  // APRs derivados del estimate
  const [longApr, setLongApr] = useState(null);
  const [shortApr, setShortApr] = useState(null);

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
      setLongApr(null);
      setShortApr(null);

      const from = {
        code: selectedCollateral.code,
        network: selectedCollateral.network,
      };
      const to = {
        code: selectedBorrow.code,
        network: selectedBorrow.network,
      };
      const ltvP = Number(selectedLTV) / 100;

      const allNets = receiveNetworksOf(to.code, currencies);
      const ordered = prioritize(allNets, to.network);
      const netsTry = ordered.length
        ? ordered.slice(0, maxTryNetworks)
        : [to.network];

      let success = false;

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
          console.log("Estimate RAW >>>", j);
          if (ctrl.signal.aborted) return;

          if (j?.result) {
            const data = j.response || null;

            // si cambió la red, sincroniza el select
            if (net !== to.network && typeof setSelectedBorrow === "function") {
              const fixed = (borrowList || []).find(
                c => c.code === to.code && c.network === net
              );
              if (fixed) setSelectedBorrow(fixed);
            }

            setEstimate(data);

            // ⬇️ derivar APRs AQUÍ, usando el JSON real que mostraste
            const la =
              data?.fixed_apr_unlimited_loan ?? data?.interest_percent ?? null;
            const sa = data?.fixed_apr_fixed_loan ?? null;

            setLongApr(la != null ? Number(la) : null);
            setShortApr(sa != null ? Number(sa) : null);

            setEstErr(null);
            setEstLoading(false);
            success = true;
            break;
          }

          // si vino error de “no existe el par”, prueba la siguiente red
          const msg = (j?.message || "").toLowerCase();
          const isPairErr =
            msg.includes("pair does not exists") ||
            msg.includes("data for currency");
          if (!isPairErr) {
            // Formatear el mensaje de error para que sea más legible
            const formattedMsg = formatErrorMessage(
              j?.message || "Estimate failed"
            );
            setEstErr(formattedMsg);
            setEstLoading(false);
            return; // Salir completamente, no continuar probando redes
          }
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
            // Formatear el mensaje de error para que sea más legible
            const formattedMsg = formatErrorMessage(
              e?.message || "Estimate failed"
            );
            setEstErr(formattedMsg);
            setEstLoading(false);
            return; // Salir completamente, no continuar probando redes
          }
          // si es “pair not exists”, sigue con la siguiente red
        }
      }

      if (!success) {
        setEstimate(null);
        setLongApr(null);
        setShortApr(null);
        setEstErr(`No available network for ${to.code} with ${from.code}.`);
      }

      setEstLoading(false);
    };

    const t = setTimeout(run, debounceMs);
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

  // ahora el hook devuelve los APR listos
  return { estimate, estLoading, estErr, longApr, shortApr };
}
