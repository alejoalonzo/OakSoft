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
    const e = new Error(j?.message || `HTTP ${r.status}`);
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
    // Preserve the status for rate limiting checks
    const enhancedError = new Error(`getEstimate failed: ${error.message}`);
    enhancedError.status = error.status;
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
