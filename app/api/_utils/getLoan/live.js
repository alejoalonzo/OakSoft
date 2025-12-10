const API = process.env.COINRABBIT_BASE_URL;
const KEY = process.env.COINRABBIT_API_KEY;

export async function getLoanByIdLive({ loanId, xUserToken }) {
  try {
    if (!KEY) {
      return {
        ok: false,
        status: 500,
        data: { error: "Missing COINRABBIT_API_KEY" },
      };
    }

    const r = await fetch(`${API}/loans/${loanId}`, {
      method: "GET",
      headers: {
        "x-api-key": KEY,
        "x-user-token": xUserToken,
      },
      cache: "no-store",
    });

    const data = await r.json();
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return {
      ok: false,
      status: 500,
      data: { error: e?.message || "CoinRabbit get loan failed" },
    };
  }
}
