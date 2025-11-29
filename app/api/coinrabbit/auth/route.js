export const runtime = "nodejs";

import { requireUser } from "@/app/api/_utils/auth";
import { ensureCoinrabbitUserToken } from "@/app/api/_utils/coinrabbitUser";

export async function GET(req) {
  try {
    const uid = await requireUser(req);

    // here we test the helper for real
    const token = await ensureCoinrabbitUserToken(uid);

    return Response.json({ ok: true, hasToken: !!token });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
    });
  }
}
