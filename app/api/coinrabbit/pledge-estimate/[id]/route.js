// app/api/coinrabbit/pledge-estimate/[id]/route.js
// Proxy to CoinRabbit pledge estimate (repayment amount).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireUser } from "@/app/api/_utils/auth";
import { ensureCoinrabbitUserToken } from "@/app/api/_utils/coinrabbitUser";

const API = process.env.COINRABBIT_BASE_URL;
const KEY = process.env.COINRABBIT_API_KEY;

export async function GET(req, { params }) {
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

    if (!id)
      return new Response(JSON.stringify({ error: "Missing loanId in URL" }), {
        status: 400,
      });

    const uid = await requireUser(req);
    const xUserToken = await ensureCoinrabbitUserToken(uid);

    const url = new URL(req.url);
    const qs = url.search ? url.search : "";

    const r = await fetch(`${API}/loans/${id}/pledge/estimate${qs}`, {
      method: "GET",
      headers: {
        "x-api-key": KEY,
        "x-user-token": xUserToken,
      },
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
          error: j?.error || j?.message || "CoinRabbit pledge estimate error",
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
