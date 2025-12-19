// Update expired deposit transaction

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

    // 3) Ownership check
    const loanRef = adminDB.collection("loans").doc(loanId);
    const snap = await loanRef.get();
    if (!snap.exists || snap.data()?.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4) CoinRabbit token
    const xUserToken = await ensureCoinrabbitUserToken(uid);

    // 5) Call CoinRabbit: no body
    const r = await fetch(`${API}/loans/${loanId}/deposit`, {
      method: "POST",
      headers: {
        "x-api-key": KEY,
        "x-user-token": xUserToken,
        "content-type": "application/json",
      },
      cache: "no-store",
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    // 6) Persist to Firestore only if CoinRabbit success
    const isSuccess = r.ok && data?.result === true;
    if (isSuccess) {
      const now = Date.now();
      const address = data?.response?.address ?? null;
      const extraId = data?.response?.extraId ?? null;

      // Update "latest state" (small fields only)
      await loanRef.set(
        {
          updatedAt: now,
          coinrabbit: {
            lastSyncedAt: now,
            depositAddress: address,
            depositExtraId: extraId,
            lastDepositRefreshAt: now,
          },
        },
        { merge: true }
      );

      // Append event log (full response goes here, not in main doc)
      await loanRef.collection("events").add({
        type: "deposit_refresh",
        at: now,
        coinrabbit: data,
      });
    }

    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch (e) {
    console.error("Update expired deposit tx error:", e);
    return NextResponse.json(
      { error: e?.message || "Update expired deposit tx failed" },
      { status: 500 }
    );
  }
}
