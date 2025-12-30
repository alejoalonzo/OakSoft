import { getIdToken } from "./session";

const BASE = "/api/coinrabbit";

async function fetchJSON(path, opts = {}) {
  const { auth: needsAuth = false, headers, ...rest } = opts;

  let authHeader = {};
  if (needsAuth) {
    const idToken = await getIdToken();
    if (!idToken) throw new Error("No logged in user");
    authHeader = { Authorization: `Bearer ${idToken}` };
  }

  const r = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    ...rest,
    headers: {
      ...(headers || {}),
      ...authHeader,
    },
  });

  // Handle aborted requests
  if (opts.signal?.aborted) {
    throw new Error("Request aborted");
  }

  let j = null;
  try {
    j = await r.json();
  } catch (parseError) {
    // If we can't parse JSON, create a basic error object
    j = { message: "Invalid JSON response" };
  }

  if (!r.ok) {
    const e = new Error(j?.message || j?.error || `HTTP ${r.status}`);
    e.status = r.status;
    e.data = j;
    e.response = r; // Keep the original response for status checks
    throw e;
  }

  return j;
}

export async function getCurrencies(params = {}, opts = {}) {
  const defaultParams = { is_enabled: null };
  const queryParams = { ...defaultParams, ...params };
  const qsStr = new URLSearchParams(queryParams).toString();

  try {
    return await fetchJSON(`/currencies?${qsStr}`, opts);
  } catch (error) {
    // Re-throw with more context for debugging
    throw new Error(`getCurrencies failed: ${error.message}`);
  }
}

export async function getEstimate(params, opts = {}) {
  if (!params) {
    throw new Error("getEstimate requires parameters");
  }

  // Validate required parameters
  const required = [
    "from_code",
    "from_network",
    "to_code",
    "to_network",
    "amount",
  ];
  for (const field of required) {
    if (!params[field]) {
      throw new Error(`getEstimate missing required parameter: ${field}`);
    }
  }

  const qsStr = new URLSearchParams(params).toString();

  try {
    return await fetchJSON(`/estimate?${qsStr}`, opts);
  } catch (error) {
    // Preserve the original error message from the API and status
    const enhancedError = new Error(error.message);
    enhancedError.status = error.status;
    enhancedError.data = error.data;
    enhancedError.originalError = error;
    throw enhancedError;
  }
}

export async function createLoan(payload, opts = {}) {
  return fetchJSON("/create", {
    method: "POST",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...opts,
  });
}

export async function confirmLoan(loanId, payoutAddress, opts = {}) {
  if (!loanId) throw new Error("confirmLoan requires loanId");
  if (!payoutAddress) throw new Error("confirmLoan requires payoutAddress");

  return fetchJSON(`/confirm/${loanId}`, {
    method: "POST",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payoutAddress }),
    ...opts,
  });
}

export async function getLoanById(loanId, opts = {}) {
  if (!loanId) throw new Error("getLoanById requires loanId");

  return fetchJSON(`/loans/${loanId}`, {
    method: "GET",
    auth: true,
    ...opts,
  });
}

// Validate payout address against a specific network using our server proxy.
// CoinRabbit expects: { address, code, network, tag }
export async function validateAddress(
  address,
  code,
  network,
  tag = null,
  opts = {}
) {
  if (!address) throw new Error("validateAddress requires address");
  if (!code) throw new Error("validateAddress requires code");
  if (!network) throw new Error("validateAddress requires network");

  return fetchJSON("/validate-address", {
    method: "POST",
    auth: true, // required because the API route uses requireUser(req)
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: String(address).trim(),
      code: String(code).trim().toUpperCase(),
      network: String(network).trim().toUpperCase(),
      tag: tag == null ? null : String(tag).trim(),
    }),
    ...opts,
  });
}

// Update expired deposit transaction
export async function refreshDepositAddress(loanId, opts = {}) {
  if (!loanId) throw new Error("refreshDepositAddress requires loanId");

  return fetchJSON(`/deposit/${loanId}`, {
    method: "POST",
    auth: true,
    ...opts,
  });
}

// Get increase estimate
export async function getIncreaseEstimate(loanId, amount, opts = {}) {
  if (!loanId) throw new Error("getIncreaseEstimate requires loanId");
  if (amount == null || String(amount).trim() === "") {
    throw new Error("getIncreaseEstimate requires amount");
  }

  const qs = new URLSearchParams({ amount: String(amount) }).toString();

  return fetchJSON(`/increase/estimate/${loanId}?${qs}`, {
    method: "GET",
    auth: true,
    ...opts,
  });
}

// Create increase tx
export async function createIncreaseTx(loanId, amount, opts = {}) {
  if (!loanId) throw new Error("createIncreaseTx requires loanId");
  if (amount == null || String(amount).trim() === "") {
    throw new Error("createIncreaseTx requires amount");
  }

  return fetchJSON(`/increase/${loanId}`, {
    method: "POST",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deposit: { amount: String(amount).trim() } }),
    ...opts,
  });
}

// Save tx if used fallback increased tx
export async function saveIncreaseFallbackTx(loanId, hash, opts = {}) {
  if (!loanId) throw new Error("saveIncreaseFallbackTx requires loanId");
  if (!hash) throw new Error("saveIncreaseFallbackTx requires hash");

  return fetchJSON(`/increase/fallback-tx/${loanId}`, {
    method: "PUT",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash: String(hash).trim() }),
    ...opts,
  });
}

// Get Estimate  pledge redemption transaction (close loan / redeem collateral)
export async function getPledgeEstimate(loanId, params = {}, opts = {}) {
  if (!loanId) throw new Error("getPledgeEstimate requires loanId");
  const qs = new URLSearchParams(params).toString();
  const path = `/pledge-estimate/${loanId}${qs ? `?${qs}` : ""}`;

  return fetchJSON(path, {
    method: "GET",
    auth: true,
    ...opts,
  });
}

// Create pledge redemption transaction (close loan / redeem collateral)
export async function createPledgeRedemptionTx(id, payload, opts = {}) {
  if (!id) throw new Error("createPledgeRedemptionTx requires id");
  if (!payload) throw new Error("createPledgeRedemptionTx requires payload");

  const address = String(payload.address || "").trim();
  const extra_id = payload.extra_id ?? null;

  const receive_from = String(payload.receive_from || "").trim();
  const repay_by_network = String(payload.repay_by_network || "").trim();
  const repay_by_code = String(payload.repay_by_code || "").trim();

  if (!address) throw new Error("createPledgeRedemptionTx missing address");
  if (!receive_from)
    throw new Error("createPledgeRedemptionTx missing receive_from");
  if (!repay_by_network)
    throw new Error("createPledgeRedemptionTx missing repay_by_network");
  if (!repay_by_code)
    throw new Error("createPledgeRedemptionTx missing repay_by_code");

  return fetchJSON(`/pledge/${id}`, {
    method: "POST",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      extra_id,
      receive_from,
      repay_by_network,
      repay_by_code,
    }),
    ...opts,
  });
}
