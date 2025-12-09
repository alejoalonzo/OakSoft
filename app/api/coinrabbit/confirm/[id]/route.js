export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/auth";
import { ensureCoinrabbitUserToken } from "@/app/api/_utils/coinrabbitUser";
import { confirmLoanLive } from "@/app/api/_utils/coinrabbitConfirm.live";
import { confirmLoanMock } from "@/app/api/_utils/coinrabbitConfirm.mock";
import { adminDB } from "@/lib/firebaseAdmin";

const confirmMode = process.env.COINRABBIT_CONFIRM_MODE ?? "live";
const isMockConfirm = confirmMode === "mock";

export async function POST(req, { params }) {
  try {
    // 1) Auth of the app
    const uid = await requireUser(req);

    // 2) loanId from URL
    const { id: loanId } = await params;

    // 3) data from front
    const { payoutAddress } = await req.json();

    if (!loanId) {
      return NextResponse.json(
        { error: "Missing loanId in URL" },
        { status: 400 }
      );
    }

    if (!payoutAddress) {
      return NextResponse.json(
        { error: "Missing payoutAddress" },
        { status: 400 }
      );
    }

    // 4) security: check ownership in Firestore
    const loanRef = adminDB.collection("loans").doc(loanId);
    const snap = await loanRef.get();

    if (!snap.exists || snap.data()?.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5) Token CoinRabbit (mock no need real)
    const xUserToken = isMockConfirm
      ? "mock-token"
      : await ensureCoinrabbitUserToken(uid);

    // 6) Execute implementation
    const impl = isMockConfirm ? confirmLoanMock : confirmLoanLive;

    const { ok, status, data } = await impl({
      loanId,
      payoutAddress,
      xUserToken,
    });

    return NextResponse.json(data, { status: ok ? 200 : status });
  } catch (e) {
    console.error("Confirm loan error:", e);
    return NextResponse.json(
      { error: e?.message || "Confirm loan failed" },
      { status: 500 }
    );
  }
}
