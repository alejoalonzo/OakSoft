const API = process.env.COINRABBIT_BASE_URL;
const KEY = process.env.COINRABBIT_API_KEY;

function assertEnv() {
  if (!API || !KEY) {
    throw new Error("Missing COINRABBIT_BASE_URL or COINRABBIT_API_KEY");
  }
}

export async function confirmLoanLive({ loanId, payoutAddress, xUserToken }) {
  assertEnv();

  if (!loanId) throw new Error("confirmLoanLive missing loanId");
  if (!payoutAddress) throw new Error("confirmLoanLive missing payoutAddress");
  if (!xUserToken) throw new Error("confirmLoanLive missing xUserToken");

  const payload = {
    loan: {
      receive_address: payoutAddress,
    },
    agreed_to_tos: true,
  };

  const r = await fetch(`${API}/loans/${loanId}/confirm`, {
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
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return { ok: r.ok, status: r.status, data };
}
