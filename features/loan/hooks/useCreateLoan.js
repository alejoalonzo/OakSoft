"use client";

import { useState } from "react";
import { createLoan as createLoanService } from "../services/coinrabbit";

export default function useCreateLoan({
  amount,
  selectedCollateral,
  selectedBorrow,
  selectedLTV,
  selectedDuration,
  estimate,
}) {
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState(null);
  const [lastLoan, setLastLoan] = useState(null);

  const handleCreate = async () => {
    setCreateErr(null);
    setCreating(true);

    try {
      if (!selectedCollateral || !selectedBorrow || !amount) {
        throw new Error("Missing data");
      }

      const ltvPercent = Number(selectedLTV) / 100;

      const lifetimeValue = selectedDuration === "long" ? 1 : 0;

      const payload = {
        deposit: {
          currency_code: selectedCollateral.code,
          currency_network: selectedCollateral.network,
          expected_amount: String(amount),
        },
        loan: {
          currency_code: selectedBorrow.code,
          currency_network: selectedBorrow.network,
          ...(estimate?.amount_to && {
            expected_amount: String(estimate.amount_to),
          }),
        },
        ltv_percent: String(ltvPercent),

        lifetime: lifetimeValue,
      };

      const res = await createLoanService(payload);
      setLastLoan(res);
      return res;
    } catch (e) {
      setCreateErr(e.message || "Create failed");
      throw e;
    } finally {
      setCreating(false);
    }
  };

  return { handleCreate, creating, createErr, lastLoan };
}
