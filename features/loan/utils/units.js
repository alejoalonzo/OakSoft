// src/features/loan/utils/units.js
// Purpose: Convert decimal strings (e.g. "0.0123") to atomic units (e.g. satoshis/wei)
// WITHOUT using floating point math.

/**
 * Convert decimal amount string to atomic string using decimals.
 * Examples:
 *  decimalToAtomic("1", 8)        -> "100000000"
 *  decimalToAtomic("0.5", 8)      -> "50000000"
 *  decimalToAtomic("12.345", 2)   -> throws (too many decimals)
 *
 * @param {string} amountStr
 * @param {number} decimals
 * @returns {string}
 */
export function decimalToAtomic(amountStr, decimals) {
  if (amountStr == null) throw new Error("decimalToAtomic: amountStr required");
  if (decimals == null) throw new Error("decimalToAtomic: decimals required");

  const s = String(amountStr).trim();
  if (!s) throw new Error("decimalToAtomic: empty amountStr");
  if (s.startsWith("-"))
    throw new Error("decimalToAtomic: negative not allowed");

  const [intPartRaw, fracPartRaw = ""] = s.split(".");
  const intPart = (intPartRaw || "0").replace(/^0+(?=\d)/, ""); // keep at least one digit
  const fracPart = fracPartRaw || "";

  if (fracPart.length > decimals) {
    // Safer to throw than silently truncate (underpay collateral)
    throw new Error(
      `decimalToAtomic: too many decimal places (max ${decimals})`
    );
  }

  const fracPadded = fracPart.padEnd(decimals, "0"); // right pad with zeros
  const base = 10n ** BigInt(decimals);

  const i = BigInt(intPart || "0");
  const f = BigInt(fracPadded || "0");

  return (i * base + f).toString();
}

/**
 * Best-effort default decimals by common symbols.
 * Use this ONLY as a fallback if you can't read decimals from CoinRabbit currencies.
 *
 * @param {string} code
 * @returns {number|null}
 */
export function defaultDecimalsByCode(code) {
  const c = String(code || "").toUpperCase();

  // Common chains/assets
  if (c === "BTC") return 8;
  if (c === "SOL") return 9;
  if (c === "TON") return 9;

  // Common EVM assets
  if (c === "ETH") return 18;
  if (c === "USDT") return 6;
  if (c === "USDC") return 6;
  if (c === "DAI") return 18;
  if (c === "WBTC") return 8;

  return null; // unknown -> force you to provide decimals
}
