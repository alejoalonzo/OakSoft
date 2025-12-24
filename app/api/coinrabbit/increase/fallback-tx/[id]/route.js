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

export async function PUT(req, { params }) {
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

    // 3) body: tx hash
    const body = await req.json().catch(() => ({}));
    const hash = String(body?.hash || "").trim();
    if (!hash) {
      return NextResponse.json({ error: "Missing hash" }, { status: 400 });
    }

    // 4) Ownership check
    const loanRef = adminDB.collection("loans").doc(loanId);
    const snap = await loanRef.get();
    if (!snap.exists || snap.data()?.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5) CoinRabbit token
    const xUserToken = await ensureCoinrabbitUserToken(uid);

    // 6) Call CoinRabbit
    const r = await fetch(`${API}/loans/${loanId}/increase/fallback-tx`, {
      method: "PUT",
      headers: {
        "x-api-key": KEY,
        "x-user-token": xUserToken,
        "content-type": "application/json",
      },
      body: JSON.stringify({ hash }),
      cache: "no-store",
    });

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    // 7) Persist (only if success)
    const ok = r.ok && data?.result === true;
    if (ok) {
      const now = Date.now();

      await loanRef.set(
        {
          updatedAt: now,
          coinrabbit: {
            lastSyncedAt: now,
            increase: {
              fallbackTxHash: hash,
              fallbackTxSavedAt: now,
            },
          },
        },
        { merge: true }
      );

      await loanRef.collection("events").add({
        type: "increase_fallback_tx_saved",
        at: now,
        payload: { hash },
        coinrabbit: data,
      });
    }

    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch (e) {
    console.error("Save fallback increase tx error:", e);
    return NextResponse.json(
      { error: e?.message || "Save fallback increase tx failed" },
      { status: 500 }
    );
  }
}
