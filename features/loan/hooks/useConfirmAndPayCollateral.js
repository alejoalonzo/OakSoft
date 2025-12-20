"use client";

// src/features/loan/hooks/useConfirmAndPayCollateral.js
// Flow:
// 1) Validate payout address (anti-bypass)
// 2) Confirm loan (server route -> CoinRabbit)
// 3) Preflight: ensure we have an active deposit address (refresh if needed)
// 4) Open wallet UI and send collateral
// 5) Optionally refresh loan status

import { useCallback, useState } from "react";
import {
  confirmLoan,
  getLoanById,
  validateAddress,
} from "../services/coinrabbit";
import { useSendCollateral } from "./useSendCollateral";
import {
  resolveCollateralChainFamily,
  getCollateralAmountAtomic,
} from "../utils/collateral";
import { getValidDepositAddress } from "../utils/getValidDepositAddress";

export function useConfirmAndPayCollateral({ summary, payoutNetwork }) {
  const { sendCollateral } = useSendCollateral();

  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(
    async ({ loanId, payoutAddress }) => {
      if (!loanId) throw new Error("Missing loanId");
      if (!payoutAddress) throw new Error("Missing payoutAddress");

      setLoading(true);
      setError("");

      try {
        // 1) Final validation (anti-bypass)
        const code = summary?.borrowCode;
        const network = payoutNetwork;
        if (!code || !network) {
          throw new Error(
            "Missing payout currency/network to validate address"
          );
        }

        const check = await validateAddress(payoutAddress, code, network, null);
        if (!check?.valid)
          throw new Error("Invalid payout address for this network");

        // 2) Confirm loan (your Next route -> CoinRabbit)
        const confirmRes = await confirmLoan(loanId, payoutAddress);

        // Collateral amount (best: store from estimate/create)
        const amountAtomic = getCollateralAmountAtomic(confirmRes, summary);
        if (!amountAtomic) {
          throw new Error(
            "Missing collateralAmountAtomic (store it from estimate/create)"
          );
        }

        // 3) Preflight: ensure deposit address is active (refresh if expired)
        const { address: depositAddress, refreshed } =
          await getValidDepositAddress(loanId);
        if (!depositAddress)
          throw new Error("Missing deposit address after preflight");

        // 4) Open wallet and send collateral
        const chain = resolveCollateralChainFamily(summary);

        const payRes = await sendCollateral({
          chain,
          recipient: depositAddress,
          amountAtomic: String(amountAtomic),
        });

        const id = payRes?.txId || "";
        setTxId(id);

        // 5) Refresh loan status (optional)
        let freshLoan = null;
        try {
          freshLoan = await getLoanById(loanId);
        } catch (_) {}

        return { confirmRes, depositAddress, refreshed, txId: id, freshLoan };
      } catch (e) {
        setError(e?.message || "Confirm/pay failed");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [sendCollateral, summary, payoutNetwork]
  );

  return { run, loading, txId, error };
}
