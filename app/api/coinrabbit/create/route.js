export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/auth";
import { ensureCoinrabbitUserToken } from "@/app/api/_utils/coinrabbitUser";
import { saveCoinrabbitLoan } from "@/app/api/_utils/coinrabbitCreate";

const API = process.env.COINRABBIT_BASE_URL;
const KEY = process.env.COINRABBIT_API_KEY;

export async function POST(req) {
  try {
    if (!API || !KEY) {
      return NextResponse.json(
        { error: "Missing COINRABBIT_BASE_URL or COINRABBIT_API_KEY" },
        { status: 500 }
      );
    }

    // 1) User of my app (Firebase)
    const uid = await requireUser(req);

    // 2) Data coming from the front
    const payload = await req.json();

    // 3) CoinRabbit token for this uid
    const xUserToken = await ensureCoinrabbitUserToken(uid);

    // 4) Call CoinRabbit: POST /v2/loans
    const r = await fetch(`${API}/loans`, {
      method: "POST",
      headers: {
        "x-api-key": KEY,
        "x-user-token": xUserToken,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    // Only CoinRabbit responded OK (HELPER CREATE LOAN )

    if (r.ok) {
      await saveCoinrabbitLoan({ uid, data, payload });
    }

    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch (e) {
    console.error("Create loan error:", e);
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e?.message || "Create loan failed" },
      { status: 500 }
    );
  }
}
