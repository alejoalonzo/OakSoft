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

export async function GET(req, { params }) {
  try {
    assertEnv();

    const uid = await requireUser(req);

    const { id: loanId } = await params;
    if (!loanId) {
      return NextResponse.json(
        { error: "Missing loanId in URL" },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const amount = url.searchParams.get("amount");
    if (!amount) {
      return NextResponse.json(
        { error: "Missing amount query param" },
        { status: 400 }
      );
    }

    const loanRef = adminDB.collection("loans").doc(loanId);
    const snap = await loanRef.get();
    if (!snap.exists || snap.data()?.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const xUserToken = await ensureCoinrabbitUserToken(uid);

    const r = await fetch(
      `${API}/loans/${loanId}/increase/estimate?amount=${encodeURIComponent(amount)}`,
      {
        method: "GET",
        headers: {
          "x-api-key": KEY,
          "x-user-token": xUserToken,
          "content-type": "application/json",
        },
        cache: "no-store",
      }
    );

    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch (e) {
    console.error("Get increase estimate error:", e);
    return NextResponse.json(
      { error: e?.message || "Get increase estimate failed" },
      { status: 500 }
    );
  }
}
