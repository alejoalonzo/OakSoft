// src/features/loan/utils/collateral.js
// Purpose: Helpers for collateral payment flow.
// - pick deposit address from confirm response
// - resolve chain family (EVM/SOL/BTC/TON)
// - get amountAtomic (prefer from confirm, else compute from summary + decimals)

import { decimalToAtomic, defaultDecimalsByCode } from "./units";

/**
 * Pick the collateral deposit address from different possible response shapes.
 * @param {any} confirmRes
 * @returns {string|null}
 */
export function pickDepositAddress(confirmRes) {
  return (
    confirmRes?.response?.collateralAddress ||
    confirmRes?.response?.collateral_address ||
    confirmRes?.response?.depositAddress ||
    confirmRes?.response?.address ||
    confirmRes?.collateralAddress ||
    confirmRes?.depositAddress ||
    confirmRes?.address ||
    null
  );
}

/**
 * Map your collateral to a chain family for wallet sending.
 * @param {any} summary
 * @returns {"EVM"|"SOL"|"BTC"|"TON"}
 */
export function resolveCollateralChainFamily(summary) {
  const code = String(summary?.collateralCode || "").toUpperCase();
  const network = String(summary?.collateralNetwork || "").toUpperCase();

  if (code === "BTC" || network.includes("BTC")) return "BTC";
  if (code === "SOL" || network.includes("SOL")) return "SOL";
  if (code === "TON" || network.includes("TON")) return "TON";

  return "EVM";
}

/**
 * Resolve decimals for collateral conversion.
 * Best: store summary.collateralDecimals from GET currencies.
 * Fallback: common defaults by code (BTC=8, ETH=18, USDC=6, etc.)
 *
 * @param {any} summary
 * @returns {number}
 */
export function resolveCollateralDecimals(summary) {
  const d =
    summary?.collateralDecimals ??
    summary?.collateral_decimals ??
    summary?.collateralPrecision ??
    summary?.collateral_precision ??
    null;

  if (typeof d === "number" && Number.isFinite(d)) return d;

  const fallback = defaultDecimalsByCode(summary?.collateralCode);
  if (fallback != null) return fallback;

  throw new Error(
    "Missing collateral decimals. Store summary.collateralDecimals from GET currencies."
  );
}

/**
 * Get collateral amountAtomic:
 * 1) Prefer atomic returned by confirm response (source of truth)
 * 2) Else compute from summary.collateralAmount (decimal) using decimals
 *
 * @param {any} confirmRes
 * @param {any} summary
 * @returns {string}
 */
export function getCollateralAmountAtomic(confirmRes, summary) {
  const fromConfirm =
    confirmRes?.response?.collateralAmountAtomic ||
    confirmRes?.response?.amountAtomic ||
    confirmRes?.collateralAmountAtomic ||
    confirmRes?.amountAtomic ||
    null;

  if (fromConfirm != null) return String(fromConfirm);

  const amountDecimal =
    summary?.collateralAmountStr ?? summary?.collateralAmount ?? null;

  if (amountDecimal == null) {
    throw new Error(
      "Missing collateralAmount in summary (need it to compute amountAtomic)"
    );
  }

  const decimals = resolveCollateralDecimals(summary);
  return decimalToAtomic(String(amountDecimal), decimals);
}
