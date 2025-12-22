export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/auth";
import { ensureCoinrabbitUserToken } from "@/app/api/_utils/coinrabbitUser";
import { adminDB } from "@/lib/firebaseAdmin";

const API = process.env.COINRABBIT_BASE_URL;
const KEY = process.env.COINRABBIT_API_KEY;

function assertEnv() {
  if (!API || !KEY) {
    throw new Error("Missing COINRABBIT_BASE_URL or COINRABBIT_API_KEY");
  }
}

function pickAmount(body) {
  // Accept both shapes:
  // 1) { deposit: { amount: "0.01" } }  (CoinRabbit docs)
  // 2) { amount: "0.01" }              (simpler client payload)
  const a =
    body?.deposit?.amount ??
    body?.deposit?.expected_amount ??
    body?.amount ??
    null;

  if (a == null) return null;

  const s = String(a).trim();
  if (!s) return null;

  // Basic sanity: must be > 0
  try {
    if (Number(s) <= 0) return null;
  } catch {
    return null;
  }

  return s;
}

export async function POST(req, { params }) {
  try {
    assertEnv();

    // 1) App auth
    const uid = await requireUser(req);

    // 2) loanId
    const { id: loanId } = await params;
    if (!loanId) {
      return NextResponse.json(
        { error: "Missing loanId in URL" },
        { status: 400 }
      );
    }

    // 3) amount from body
    const body = await req.json().catch(() => ({}));
    const amount = pickAmount(body);
    if (!amount) {
      return NextResponse.json(
        { error: "Missing deposit.amount" },
        { status: 400 }
      );
    }

    // 4) Ownership check
    const loanRef = adminDB.collection("loans").doc(loanId);
    const snap = await loanRef.get();
    if (!snap.exists || snap.data()?.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5) CoinRabbit token
    const xUserToken = await ensureCoinrabbitUserToken(uid);

    // 6) Call CoinRabbit: POST /loans/:id/increase
    const payload = { deposit: { amount } };

    const r = await fetch(`${API}/loans/${loanId}/increase`, {
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

    // 7) Persist (only on success)
    const isSuccess = r.ok && data?.result === true;
    if (isSuccess) {
      const now = Date.now();
      const address = data?.response?.address ?? null;
      const extraId = data?.response?.extraId ?? null;
      const isFallbackTx = data?.response?.isFallbackTx ?? null;

      await loanRef.set(
        {
          updatedAt: now,
          coinrabbit: {
            lastSyncedAt: now,
            increase: {
              lastCreatedAt: now,
              amountRequested: amount,
              address,
              extraId,
              isFallbackTx,
            },
          },
        },
        { merge: true }
      );

      await loanRef.collection("events").add({
        type: "increase_create",
        at: now,
        payload,
        coinrabbit: data,
      });
    }

    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch (e) {
    console.error("Create increase tx error:", e);
    return NextResponse.json(
      { error: e?.message || "Create increase tx failed" },
      { status: 500 }
    );
  }
}
