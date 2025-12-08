// features/loan/utils/addressValidation.js
import WAValidator from "multicoin-address-validator";

const SYMBOL_MAP = {
  BTC: "btc",
  SOL: "sol",
  ETH: "eth",
  USDT: "usdt",
  USDC: "usdc",
};

export function validateAddressForLoan(address, borrowCode) {
  const value = (address || "").trim();

  if (!value) {
    return { valid: false, error: "Address is required." };
  }

  if (!borrowCode) {
    // if I dont know the coin, no blocking here
    return { valid: true, error: "" };
  }

  const codeUpper = String(borrowCode).toUpperCase();
  const netLower = String(borrowNetwork || "").toLowerCase();

  const symbol =
    SYMBOL_MAP[borrowCode.toUpperCase()] || borrowCode.toLowerCase();

  // if ETH / USDT / USDC / red eth/erc20/polygon/base/etc →  0x...
  const isEvmLike =
    codeUpper === "ETH" ||
    ["USDT", "USDC", "DAI", "WBTC", "LINK", "MATIC"].includes(codeUpper) ||
    netLower.includes("eth") ||
    netLower.includes("erc20") ||
    netLower.includes("polygon") ||
    netLower.includes("base") ||
    netLower.includes("arbitrum") ||
    netLower.includes("optimism") ||
    netLower.includes("evm");

  if (isEvmLike && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return {
      valid: false,
      error: `This address must be an EVM address (0x...) for ${borrowCode}.`,
    };
  }

  try {
    const ok = WAValidator.validate(value, symbol); //  The lib makes the magic here

    if (!ok) {
      return {
        valid: false,
        error: `This address is not valid for ${borrowCode}.`,
      };
    }

    return { valid: true, error: "" };
  } catch (e) {
    console.error("Address validation error:", e);
    // If the library does not support that coin, we do not break the UX:
    return { valid: true, error: "" };
  }
}
