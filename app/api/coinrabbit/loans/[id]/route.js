export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/auth";
import { ensureCoinrabbitUserToken } from "@/app/api/_utils/coinrabbitUser";
import { getLoanByIdLive } from "@/app/api/_utils/getLoan/live";
import { getLoanByIdMock } from "@/app/api/_utils/getLoan/mock";
import { adminDB } from "@/lib/firebaseAdmin";

const getLoanMode = process.env.COINRABBIT_GET_LOAN_MODE ?? "live";
const isMockGetLoan = getLoanMode === "mock";

export async function GET(req, { params }) {
  try {
    // 1) Auth of the app
    const uid = await requireUser(req);

    // 2) loanId from URL
    const { id: loanId } = await params;

    if (!loanId) {
      return NextResponse.json(
        { error: "Missing loanId in URL" },
        { status: 400 }
      );
    }

    // 3) security: check ownership in Firestore
    const loanRef = adminDB.collection("loans").doc(loanId);
    const snap = await loanRef.get();

    if (!snap.exists || snap.data()?.uid !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4) Token CoinRabbit (mock no need real)
    const xUserToken = isMockGetLoan
      ? "mock-token"
      : await ensureCoinrabbitUserToken(uid);

    // 5) Execute implementation
    const impl = isMockGetLoan ? getLoanByIdMock : getLoanByIdLive;

    const { ok, status, data } = await impl({
      loanId,
      xUserToken,
    });

    // 6) Sync phase/status to Firestore (does not change API response)
    if (ok) {
      const now = Date.now();
      const resp = data?.response || {};

      const depTx = String(
        resp?.deposit?.transaction_status || ""
      ).toLowerCase(); // waiting|confirming|finished
      const coinrabbitStatus = resp?.status || null;

      const current = snap.data() || {};
      const currentPhase = current.phase || null;

      let nextPhase = currentPhase;

      // If deposit tx is finished => ACTIVE
      if (depTx.includes("finished")) nextPhase = "ACTIVE";

      // Optional: if loan closed => CLOSED (leave commented if you want for now)
      // const s = String(coinrabbitStatus || "").toLowerCase();
      // if (s.includes("closed") || s.includes("repaid") || s.includes("liquidat") || s.includes("cancel")) {
      //   nextPhase = "CLOSED";
      // }

      await loanRef.set(
        {
          updatedAt: now,
          phase: nextPhase,
          status: coinrabbitStatus || current.status || null,
          coinrabbit: {
            ...(current.coinrabbit || {}),
            lastSyncedAt: now,
            status: coinrabbitStatus,
            depositTxStatus: resp?.deposit?.transaction_status || null,
          },
        },
        { merge: true }
      );
    }

    return NextResponse.json(data, { status: ok ? 200 : status });
  } catch (e) {
    console.error("Get loan by id error:", e);
    return NextResponse.json(
      { error: e?.message || "Get loan by id failed" },
      { status: 500 }
    );
  }
}
