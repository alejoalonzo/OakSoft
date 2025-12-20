// src/features/loan/utils/getValidDepositAddress.js
// Purpose: Ensure we have an active deposit address before opening the wallet.
// Strategy:
// 1) Fetch loan state from CoinRabbit (via our proxy)
// 2) If deposit is active and has send_address -> use it
// 3) Otherwise call refreshDepositAddress() and use the returned address

import { getLoanById, refreshDepositAddress } from "../services/coinrabbit";

export async function getValidDepositAddress(loanId) {
  if (!loanId) throw new Error("getValidDepositAddress requires loanId");

  const loan = await getLoanById(loanId);
  const deposit = loan?.response?.deposit || {};

  const isActive = deposit?.active === true;
  const sendAddress = deposit?.send_address || null;

  if (isActive && sendAddress) {
    return { address: sendAddress, refreshed: false, loan };
  }

  const refreshed = await refreshDepositAddress(loanId);
  const refreshedAddress = refreshed?.response?.address || null;

  if (!refreshedAddress) {
    throw new Error("refreshDepositAddress did not return address");
  }

  return { address: refreshedAddress, refreshed: true, loan };
}
