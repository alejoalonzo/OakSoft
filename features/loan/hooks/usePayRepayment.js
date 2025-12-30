"use client";

import { useCallback, useState } from "react";
import { useSendCollateral } from "./useSendCollateral";

// ---- helpers ----
function upper(x) {
  return String(x || "")
    .trim()
    .toUpperCase();
}

function resolveRepaymentChainFamily(currencyNetwork) {
  const n = upper(currencyNetwork);

  const EVM = new Set([
    "ETH",
    "MAINNET",
    "ARBITRUM",
    "OPTIMISM",
    "BASE",
    "POLYGON",
    "BSC",
    "AVALANCHE",
    "LINEA",
    "SCROLL",
    "GNOSIS",
  ]);

  if (EVM.has(n)) return "EVM";
  if (n === "SOL" || n === "SOLANA") return "SOL";
  if (n === "BTC" || n === "BITCOIN") return "BTC";
  if (n === "TON") return "TON";

  throw new Error(`Unsupported repayment network: ${n}`);
}

function isEvmNative(code, network) {
  const c = upper(code);
  const n = upper(network);

  if (
    [
      "ETH",
      "MAINNET",
      "ARBITRUM",
      "OPTIMISM",
      "BASE",
      "LINEA",
      "SCROLL",
    ].includes(n)
  ) {
    return c === "ETH";
  }
  if (n === "POLYGON") return c === "MATIC";
  if (n === "BSC") return c === "BNB";
  if (n === "AVALANCHE") return c === "AVAX";
  if (n === "GNOSIS") return c === "XDAI";
  return false;
}

// Decimal string -> atomic integer string (for SOL/BTC where we accept truncation)
function decimalToAtomic(amountStr, decimals) {
  const s = String(amountStr || "").trim();
  if (!s) throw new Error("Missing amount");
  if (s.startsWith("-")) throw new Error("Negative amount not allowed");

  const [iRaw, fRaw = ""] = s.split(".");
  const i = iRaw.replace(/^0+(?=\d)/, "") || "0";
  const f = (fRaw + "0".repeat(decimals)).slice(0, decimals);
  const out = (i + f).replace(/^0+(?=\d)/, "") || "0";
  return out;
}

// This is the ONLY place where we interpret CoinRabbit currency objects.
function getEvmTokenMetaFromCurrencies(currencies, code, network) {
  const c = upper(code);
  const n = upper(network);

  const list = Array.isArray(currencies) ? currencies : [];
  const item = list.find(x => upper(x?.code) === c && upper(x?.network) === n);

  if (!item) {
    throw new Error(`Currency not found in currencies list: ${c}/${n}`);
  }

  // CoinRabbit fields in your payload: smart_contract + decimal_places
  const tokenAddress =
    item?.smart_contract ||
    item?.smartContract ||
    item?.smart_contract_address ||
    item?.smartContractAddress ||
    item?.contract_address ||
    item?.contractAddress ||
    item?.token_address ||
    item?.tokenAddress ||
    item?.contract ||
    item?.address ||
    null;

  const decimalsRaw =
    item?.decimal_places ??
    item?.decimalPlaces ??
    item?.decimals ??
    item?.token_decimals ??
    item?.tokenDecimals ??
    item?.precision ??
    null;

  const decimalsNum = Number(decimalsRaw);
  const decimals = Number.isFinite(decimalsNum) ? decimalsNum : null;

  if (!tokenAddress) {
    const keys = Object.keys(item || {})
      .slice(0, 60)
      .join(", ");
    throw new Error(
      `Missing token contract field for ${c}/${n}. Keys present: ${keys}`
    );
  }

  return {
    tokenAddress: String(tokenAddress),
    decimals: decimals ?? 18,
  };
}

function pow10(decimals) {
  return 10n ** BigInt(decimals);
}

// Convert decimal string -> atomic integer string.
// If too many decimals, CEIL by 1 minimal unit to avoid underpay.
function toAtomicCeil(amountStr, decimals) {
  const s = String(amountStr || "").trim();
  if (!s) throw new Error("Missing amount");
  if (s.startsWith("-")) throw new Error("Negative amount not allowed");

  const [iRaw, fRaw = ""] = s.split(".");
  const iPart = iRaw === "" ? "0" : iRaw;

  const frac = String(fRaw);
  const keep = frac.slice(0, decimals);
  const rest = frac.slice(decimals);

  const keepPadded = (keep + "0".repeat(decimals)).slice(0, decimals);

  let atomic =
    BigInt(iPart || "0") * pow10(decimals) + BigInt(keepPadded || "0");

  // if we had extra decimals and any was non-zero => +1 minimal unit
  if (rest && /[1-9]/.test(rest)) atomic += 1n;

  return atomic.toString();
}

function toAtomicTruncWithExtra(amountStr, decimals) {
  const s = String(amountStr || "").trim();
  if (!s) return { atomic: "0", extra: false };
  if (s.startsWith("-")) throw new Error("Negative amount not allowed");

  const [iRaw, fRaw = ""] = s.split(".");
  const iPart = iRaw === "" ? "0" : iRaw;

  const frac = String(fRaw);
  const keep = frac.slice(0, decimals);
  const rest = frac.slice(decimals);
  const keepPadded = (keep + "0".repeat(decimals)).slice(0, decimals);

  const atomic =
    BigInt(iPart || "0") * 10n ** BigInt(decimals) + BigInt(keepPadded || "0");

  const extra = !!(rest && /[1-9]/.test(rest));
  return { atomic: atomic.toString(), extra };
}

// ceil(sum(parts)) in atomic units, with at most +1 minimal unit total
function toAtomicCeilSum(parts, decimals) {
  let total = 0n;
  let extra = false;

  for (const p of parts) {
    const { atomic, extra: ex } = toAtomicTruncWithExtra(p, decimals);
    total += BigInt(atomic);
    extra = extra || ex;
  }

  if (extra) total += 1n;
  return total.toString();
}

// ---- hook ----
export function usePayRepayment({ currencies }) {
  const { sendCollateral } = useSendCollateral();

  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(
    async ({ repayment }) => {
      setLoading(true);
      setError("");
      setTxId("");

      try {
        if (!repayment) {
          throw new Error("Missing repayment (run Get loan by id first)");
        }

        // ✅ PAY TO CoinRabbit repayment address
        // - preferred: repayment.send_address (from GET loan by id)
        // - fallback: repayment.address (if you pass pledgeResult.response directly)
        const payToAddress = String(
          repayment.send_address || repayment.address || ""
        ).trim();

        const amountStr = String(
          repayment.amount_to_repayment || repayment.amount || ""
        ).trim();

        const code = String(repayment.currency_code || "").trim();
        const network = String(repayment.currency_network || "").trim();

        if (!payToAddress) throw new Error("Missing repayment.send_address");
        if (!amountStr)
          throw new Error("Missing repayment.amount_to_repayment");
        if (!code || !network) {
          throw new Error("Missing repayment currency_code / currency_network");
        }

        const isWaiting =
          repayment.active === true &&
          String(repayment.transaction_status || "").toLowerCase() !==
            "finished";

        // ✅ If CoinRabbit gives amount+fee, use that as the "real" remaining invoice
        const hasAmountOrFee =
          String(repayment.amount || "").trim() ||
          String(repayment.fee || "").trim();

        const chain = resolveRepaymentChainFamily(network);

        let amountAtomic = null;

        // ----- EVM -----
        if (chain === "EVM") {
          // Native coin (ETH/MATIC/BNB/etc)
          if (isEvmNative(code, network)) {
            const decimals = 18;
            amountAtomic = hasAmountOrFee
              ? toAtomicCeilSum([repayment.amount, repayment.fee], decimals)
              : toAtomicCeil(amountStr, decimals);

            if (!amountAtomic || BigInt(amountAtomic) <= 0n) {
              throw new Error("Invalid computed repayment amount");
            }

            const out = await sendCollateral({
              chain: "EVM",
              recipient: payToAddress,
              amountAtomic,
              assetType: "native",
            });

            const id = out?.txId || "";
            setTxId(id);
            return { txId: id };
          }

          // ERC20 token
          const meta = getEvmTokenMetaFromCurrencies(currencies, code, network);
          amountAtomic = hasAmountOrFee
            ? toAtomicCeilSum([repayment.amount, repayment.fee], meta.decimals)
            : toAtomicCeil(amountStr, meta.decimals);

          if (!amountAtomic || BigInt(amountAtomic) <= 0n) {
            throw new Error("Invalid computed repayment amount");
          }

          const out = await sendCollateral({
            chain: "EVM",
            recipient: payToAddress,
            amountAtomic,
            assetType: "erc20",
            tokenAddress: meta.tokenAddress,
          });

          const id = out?.txId || "";
          setTxId(id);
          return { txId: id };
        }

        // ----- SOL -----
        if (chain === "SOL") {
          amountAtomic = hasAmountOrFee
            ? toAtomicCeilSum([repayment.amount, repayment.fee], 9)
            : toAtomicCeil(amountStr, 9);
          if (!amountAtomic || BigInt(amountAtomic) <= 0n) {
            throw new Error("Invalid computed repayment amount");
          }
          const out = await sendCollateral({
            chain: "SOL",
            recipient: payToAddress,
            amountAtomic,
          });
          const id = out?.txId || "";
          setTxId(id);
          return { txId: id };
        }

        // ----- BTC -----
        if (chain === "BTC") {
          amountAtomic = hasAmountOrFee
            ? toAtomicCeilSum([repayment.amount, repayment.fee], 8)
            : toAtomicCeil(amountStr, 8);
          if (!amountAtomic || BigInt(amountAtomic) <= 0n) {
            throw new Error("Invalid computed repayment amount");
          }
          const out = await sendCollateral({
            chain: "BTC",
            recipient: payToAddress,
            amountAtomic,
          });
          const id = out?.txId || "";
          setTxId(id);
          return { txId: id };
        }

        // ----- TON -----
        if (chain === "TON") {
          throw new Error("TON repayment not wired in useSendCollateral yet");
        }

        throw new Error(`Unsupported chain: ${chain}`);
      } catch (e) {
        setError(e?.message || "Pay repayment failed");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [sendCollateral, currencies]
  );

  return { run, loading, txId, error };
}
