"use client";

import { useEffect, useState } from "react";
import { sortBy } from "../utils/formatting";
import { isSameAsCollateral } from "../utils/token";
import { getCurrencies } from "../services/coinrabbit";

/**
 * Loads and maintains coin lists (deposit/borrow) and
 * selects valid options by default. It also prevents
 * borrowing from being equal to collateral (same code + network).
 */
export default function useCurrencies() {
  const [currencies, setCurrencies] = useState([]);

  const [depositList, setDepositList] = useState([]);
  const [borrowList, setBorrowList] = useState([]);

  const [selectedCollateral, setSelectedCollateral] = useState(null);
  const [selectedBorrow, setSelectedBorrow] = useState(null);

  const [loadingCur, setLoadingCur] = useState(false);
  const [curErr, setCurErr] = useState(null);

  // Load currencies
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingCur(true);
      setCurErr(null);
      try {
        const j = await getCurrencies();
        if (cancel) return;

        const arr = Array.isArray(j?.response) ? j.response : [];

        const byDeposit = sortBy(
          arr.filter(c => c?.is_loan_deposit_enabled === true),
          "loan_deposit_priority"
        );

        const byBorrow = sortBy(
          arr.filter(c => c?.is_loan_receive_enabled === true),
          "loan_borrow_priority"
        );

        setCurrencies(arr);
        setDepositList(byDeposit);
        setBorrowList(byBorrow);

        if (!selectedCollateral && byDeposit.length) {
          const firstCol = byDeposit[0];
          setSelectedCollateral(firstCol);

          // pick a default borrow not clashing with the default collateral
          const firstBorrow =
            byBorrow.find(c => !isSameAsCollateral(c, firstCol)) ||
            byBorrow[0] ||
            null;
          setSelectedBorrow(firstBorrow || null);
        } else if (!selectedBorrow && byBorrow.length) {
          setSelectedBorrow(byBorrow[0]);
        }
      } catch (e) {
        if (!cancel) setCurErr(e?.message || "Error loading currencies");
      } finally {
        if (!cancel) setLoadingCur(false);
      }
    })();

    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep borrow different from collateral
  useEffect(() => {
    if (!selectedCollateral || !selectedBorrow) return;
    if (isSameAsCollateral(selectedBorrow, selectedCollateral)) {
      const alt = borrowList.find(
        c => !isSameAsCollateral(c, selectedCollateral)
      );
      if (alt) setSelectedBorrow(alt);
    }
  }, [selectedCollateral, selectedBorrow, borrowList]);

  return {
    // lists & raw
    currencies,
    depositList,
    borrowList,

    // selections
    selectedCollateral,
    setSelectedCollateral,
    selectedBorrow,
    setSelectedBorrow,

    // status
    loadingCur,
    curErr,
  };
}
