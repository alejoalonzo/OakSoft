import { getIdToken } from "./session";

const BASE = "/api/coinrabbit";

async function fetchJSON(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, { cache: "no-store", ...opts });

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

export async function createLoan(payload) {
  const idToken = await getIdToken();
  const res = await fetch("/api/coinrabbit/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(json?.error || text);
  return json;
}
export function getLoanById(id) {
  return fetchJSON(`/loans/${id}`);
}

export function liquidateLoan(id) {
  return fetchJSON(`/loans/${id}/liquidate`, { method: "POST" });
}
