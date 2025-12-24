"use client";

// src/features/loan/hooks/useCreatePledgeRedemptionTx.js
// Purpose:
// - Calls our server route: POST /api/coinrabbit/pledge/:id
// - Creates a pledge redemption tx (used to close/redeem the loan)

import { useCallback, useState } from "react";
import { createPledgeRedemptionTx } from "../services/coinrabbit";

export function useCreatePledgeRedemptionTx() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const run = useCallback(
    async (
      {
        id,
        address,
        extraId,
        receiveFrom,
        repayByNetwork,
        repayByCode,
        amount,
      },
      opts = {}
    ) => {
      setLoading(true);
      setError("");
      setResult(null);

      try {
        const loanId = String(id || "").trim();
        if (!loanId) throw new Error("Missing id (loan id)");

        const payoutAddress = String(address || "").trim();
        if (!payoutAddress) throw new Error("Missing address");

        const extra_id =
          extraId == null || String(extraId).trim() === ""
            ? null
            : String(extraId).trim();

        const receive_from = String(receiveFrom || "").trim(); // "external_wallet"
        if (!receive_from) throw new Error("Missing receiveFrom");

        const repay_by_network = String(repayByNetwork || "").trim();
        if (!repay_by_network) throw new Error("Missing repayByNetwork");

        const repay_by_code = String(repayByCode || "").trim();
        if (!repay_by_code) throw new Error("Missing repayByCode");

        if (amount == null || String(amount).trim() === "")
          throw new Error("Missing amount");

        const out = await createPledgeRedemptionTx(
          loanId,
          {
            address: payoutAddress,
            extra_id,
            receive_from,
            repay_by_network,
            repay_by_code,
            amount,
          },
          opts
        );

        setResult(out);
        return out;
      } catch (e) {
        setError(e?.message || "Create pledge repayment failed");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { run, loading, error, result };
}
