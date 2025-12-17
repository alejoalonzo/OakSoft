"use client";

// src/features/loan/hooks/useConfirmAndPayCollateral.js
// Purpose: Keep Confirm modal small.
// Flow:
// 1) Final validate payout address (anti-bypass)
// 2) Call  server route: confirmLoan(loanId, payoutAddress) -> returns deposit address
// 3) Open wallet UI and send collateral to deposit address
// 4) Optionally refresh loan status

import { useCallback, useState } from "react";
import {
  confirmLoan,
  getLoanById,
  validateAddress,
} from "../services/coinrabbit";
import { useSendCollateral } from "./useSendCollateral";
import {
  pickDepositAddress,
  resolveCollateralChainFamily,
  getCollateralAmountAtomic,
} from "../utils/collateral";

export function useConfirmAndPayCollateral({ summary, payoutNetwork }) {
  const { sendCollateral } = useSendCollateral();

  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(
    /**
     * @param {Object} p
     * @param {string} p.loanId
     * @param {string} p.payoutAddress
     */
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

        const depositAddress = pickDepositAddress(confirmRes);
        if (!depositAddress)
          throw new Error("Confirm did not return deposit address");

        const amountAtomic = getCollateralAmountAtomic(confirmRes, summary);
        if (!amountAtomic) {
          // IMPORTANT: store summary.collateralAmountAtomic from estimate/create to avoid this.
          throw new Error(
            "Missing collateralAmountAtomic (store it from estimate/create)"
          );
        }

        // 3) Open wallet and send collateral
        const chain = resolveCollateralChainFamily(summary);

        const payRes = await sendCollateral({
          chain,
          recipient: depositAddress,
          amountAtomic: String(amountAtomic),

          // Optional EVM ERC20 support (wire when tokenAddress):
          // assetType: "erc20",
          // tokenAddress: summary?.collateralTokenAddress,
        });

        const id = payRes?.txId || "";
        setTxId(id);

        // 4) Refresh loan status (optional)
        let freshLoan = null;
        try {
          freshLoan = await getLoanById(loanId);
        } catch (_) {}

        return { confirmRes, depositAddress, txId: id, freshLoan };
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
