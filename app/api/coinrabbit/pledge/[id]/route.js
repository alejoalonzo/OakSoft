// app/api/coinrabbit/pledge/[id]/route.js
// Loan repayment (close loan).
// New payload from CoinRabbit support (partner auth):
// { address, extra_id, receive_from, repay_by_network, repay_by_code, amount }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireUser } from "@/app/api/_utils/auth";
import { ensureCoinrabbitUserToken } from "@/app/api/_utils/coinrabbitUser";

const API = process.env.COINRABBIT_BASE_URL;
const KEY = process.env.COINRABBIT_API_KEY;

export async function POST(req, { params }) {
  try {
    if (!API || !KEY) {
      return new Response(
        JSON.stringify({
          error: "Missing COINRABBIT_BASE_URL or COINRABBIT_API_KEY",
        }),
        { status: 500 }
      );
    }
    const p = await params;
    const id = String(p?.id || "").trim();
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing loanId in URL" }), {
        status: 400,
      });
    }

    const uid = await requireUser(req);
    const xUserToken = await ensureCoinrabbitUserToken(uid);

    const body = await req.json().catch(() => ({}));

    const address = String(body.address || "").trim();
    const extra_id = body.extra_id ?? null;

    const receive_from = String(body.receive_from || "").trim(); // e.g. "external_wallet"
    const repay_by_network = String(body.repay_by_network || "").trim(); // e.g. "trx"
    const repay_by_code = String(body.repay_by_code || "").trim(); // e.g. "usdt"

    if (!address || !receive_from || !repay_by_network || !repay_by_code) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: address, receive_from, repay_by_network, repay_by_code, amount",
        }),
        { status: 400 }
      );
    }

    const payload = {
      address,
      extra_id,
      receive_from,
      repay_by_network,
      repay_by_code,
    };

    const r = await fetch(`${API}/loans/${id}/pledge`, {
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
    let j;
    try {
      j = JSON.parse(text);
    } catch {
      j = { raw: text };
    }

    if (!r.ok || j?.result === false) {
      return new Response(
        JSON.stringify({
          error:
            j?.error || j?.message || "CoinRabbit pledge (repayment) error",
          raw: j,
        }),
        { status: r.status || 400 }
      );
    }

    return Response.json(j);
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
    });
  }
}
