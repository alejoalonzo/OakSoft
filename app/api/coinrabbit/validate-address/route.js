// app/api/coinrabbit/validate-address/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/auth";
import { ensureCoinrabbitUserToken } from "@/app/api/_utils/coinrabbitUser";

const BASE_URL = process.env.COINRABBIT_BASE_URL; // e.g. https://api.coinrabbit.io/v2
const API_KEY = process.env.COINRABBIT_API_KEY;

export async function POST(req) {
  try {
    if (!BASE_URL || !API_KEY) {
      return NextResponse.json(
        {
          valid: false,
          error: "Missing COINRABBIT_BASE_URL or COINRABBIT_API_KEY",
        },
        { status: 500 }
      );
    }

    // Keep this endpoint protected like the rest of your routes
    const uid = await requireUser(req);
    const xUserToken = await ensureCoinrabbitUserToken(uid);

    let body = {};
    try {
      body = await req.json();
    } catch (_) {}

    const address = String(body.address || "").trim();
    const network = String(body.network || "")
      .trim()
      .toUpperCase();
    const code = String(body.code || "")
      .trim()
      .toUpperCase(); // IMPORTANT (USDC, BTC, etc.)
    const tag = body.tag == null ? null : String(body.tag).trim();

    if (!address || !network || !code) {
      return NextResponse.json(
        { valid: false, error: "Missing address, network, or code" },
        { status: 400 }
      );
    }

    // NOTE: Endpoint path is /v2/utils/validate/address (NOT validate-address)
    const url = `${String(BASE_URL).replace(/\/+$/, "")}/utils/validate/address`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "x-user-token": xUserToken, // keep for consistency; ok if not required
        "content-type": "application/json",
      },
      body: JSON.stringify({ address, code, network, tag }),
      cache: "no-store",
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!r.ok) {
      return NextResponse.json(
        {
          valid: false,
          error: data?.message || "CoinRabbit validate address failed",
          raw: data,
        },
        { status: r.status }
      );
    }

    // CoinRabbit shape (based on your screenshot):
    // { result: true, response: { is_address_valid, is_memo_required, is_tag_valid, message } }
    const resultOk = data?.result === true;
    const isAddressValid = data?.response?.is_address_valid === true;
    const isTagValid = data?.response?.is_tag_valid !== false; // treat missing as ok
    const memoRequired = data?.response?.is_memo_required === true;

    const valid = resultOk && isAddressValid && isTagValid && !memoRequired;

    return NextResponse.json(
      {
        valid,
        // Useful for UI messages (no hardcoding)
        message:
          data?.response?.message ||
          (valid ? "Address is valid" : "Address is invalid"),
        memoRequired,
        raw: data,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Validate address error:", e);
    return NextResponse.json(
      { valid: false, error: e?.message || "Validate address failed" },
      { status: 500 }
    );
  }
}
