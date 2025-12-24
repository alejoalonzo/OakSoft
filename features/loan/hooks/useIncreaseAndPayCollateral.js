"use client";

// Flow:
// 1) Get increase estimate (requires amount)
// 2) Create increase tx (returns deposit address)
// 3) Open wallet and send the extra collateral to that address
// 4) If isFallbackTx === true, save tx hash via PUT fallback-tx
// 5) Optionally refresh loan state

import { useCallback, useState } from "react";
import {
  getIncreaseEstimate,
  createIncreaseTx,
  saveIncreaseFallbackTx,
  getLoanById,
} from "../services/coinrabbit";
import { useSendCollateral } from "./useSendCollateral";
import {
  resolveCollateralChainFamily,
  resolveCollateralDecimals,
} from "../utils/collateral";
import { decimalToAtomic } from "../utils/units";

function assertResultOk(res, label) {
  if (!res) throw new Error(`${label} returned empty response`);
  if (res?.result !== true) {
    const msg = res?.response?.error || `${label} failed`;
    throw new Error(msg);
  }
}

function buildFallbackSummaryFromLoan(loanByIdRes) {
  const r = loanByIdRes?.response || {};
  const inc = r?.increase || {};
  const dep = r?.deposit || {};

  const code = inc?.currency_code || dep?.currency_code || null;
  const network = inc?.currency_network || dep?.currency_network || null;

  return { collateralCode: code, collateralNetwork: network };
}

export function useIncreaseAndPayCollateral({ summary }) {
  const { sendCollateral } = useSendCollateral();

  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(
    async ({ loanId, amount }) => {
      if (!loanId) throw new Error("Missing loanId");
      if (amount == null || String(amount).trim() === "") {
        throw new Error("Missing amount");
      }

      setLoading(true);
      setError("");

      try {
        const amountStr = String(amount).trim();

        let localSummary = summary;
        let baseLoan = null;

        if (!localSummary) {
          baseLoan = await getLoanById(loanId);
          localSummary = buildFallbackSummaryFromLoan(baseLoan);
        }

        if (!localSummary?.collateralCode || !localSummary?.collateralNetwork) {
          throw new Error("Missing collateral code/network for increase flow");
        }

        // 1) Estimate
        const estimateRes = await getIncreaseEstimate(loanId, amountStr);
        assertResultOk(estimateRes, "Increase estimate");

        const realIncreaseAmount =
          estimateRes?.response?.real_increase_amount != null
            ? String(estimateRes.response.real_increase_amount)
            : amountStr;

        // 2) Create increase tx
        const createRes = await createIncreaseTx(loanId, realIncreaseAmount);
        assertResultOk(createRes, "Create increase tx");

        const depositAddress = createRes?.response?.address || null;
        if (!depositAddress)
          throw new Error("Increase tx did not return address");

        const isFallbackTx = createRes?.response?.isFallbackTx === true;

        // 3) Send collateral via wallet
        const chain = resolveCollateralChainFamily(localSummary);
        const decimals = resolveCollateralDecimals(localSummary);
        const amountAtomic = decimalToAtomic(
          String(realIncreaseAmount),
          decimals
        );

        const payRes = await sendCollateral({
          chain,
          recipient: depositAddress,
          amountAtomic: String(amountAtomic),
        });

        const id = payRes?.txId || "";
        setTxId(id);

        // 4) If fallback, save tx hash
        let fallbackSaved = false;
        if (isFallbackTx) {
          if (!id) throw new Error("Missing txId for fallback tx save");
          const saved = await saveIncreaseFallbackTx(loanId, id);
          fallbackSaved = saved?.result === true;
        }

        // 5) Refresh loan (optional)
        let freshLoan = null;
        try {
          freshLoan = await getLoanById(loanId);
        } catch (_) {}

        return {
          estimateRes,
          createRes,
          realIncreaseAmount,
          depositAddress,
          isFallbackTx,
          fallbackSaved,
          txId: id,
          freshLoan,
        };
      } catch (e) {
        setError(e?.message || "Increase flow failed");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [sendCollateral, summary]
  );

  return { run, loading, txId, error };
}
