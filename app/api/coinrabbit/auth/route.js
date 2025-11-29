export const runtime = "nodejs"; // firebase-admin necesita Node

import { requireUser } from "@/app/api/_utils/auth";

const KEY = process.env.COINRABBIT_API_KEY;
const API = process.env.COINRABBIT_BASE_URL;

export async function GET(req) {
  try {
    if (!API || !KEY) {
      return Response.json(
        { error: "Missing env COINRABBIT_API_BASE or COINRABBIT_API_KEY" },
        { status: 500 }
      );
    }
    const uid = await requireUser(req);

    const r = await fetch(`${API}/auth/partner`, {
      method: "POST",
      headers: {
        "x-api-key": KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({ external_id: uid }),
      cache: "no-store",
    });

    const text = await r.text();

    if (!r.ok) {
      // pasa el error tal cual (puede ser JSON o texto)
      return new Response(text, {
        status: r.status,
        headers: {
          "content-type": r.headers.get("content-type") || "text/plain",
        },
      });
    }

    let j;
    try {
      j = JSON.parse(text);
    } catch {
      j = { raw: text };
    }

    const token = j?.response?.token;

    return Response.json({ ok: true, hasToken: !!token, raw: j });
  } catch (e) {
    if (e instanceof Response) return e; // respeta 401 de requireUser
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
    });
  }
}
