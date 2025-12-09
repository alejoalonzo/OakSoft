// /app/api/_utils/coinrabbitUser.js
import { adminDB } from "@/lib/firebaseAdmin";

const API = process.env.COINRABBIT_BASE_URL;
const KEY = process.env.COINRABBIT_API_KEY;

export async function ensureCoinrabbitUserToken(uid) {
  if (!API || !KEY) {
    throw new Error("Missing COINRABBIT_BASE_URL or COINRABBIT_API_KEY");
  }

  const docRef = adminDB.collection("coinrabbit_users").doc(uid);
  const snap = await docRef.get();

  // 1) If I already have a token saved, return it
  if (snap.exists && snap.data()?.xUserToken) {
    return snap.data().xUserToken;
  }

  // 2) If not, request it again from CoinRabbit
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
  if (!r.ok) throw new Error(`CoinRabbit auth failed: ${text}`);

  let j;
  try {
    j = JSON.parse(text);
  } catch {
    j = { raw: text };
  }

  const token = j?.response?.token;
  if (!token) throw new Error("No token in CoinRabbit auth response");

  await docRef.set(
    { xUserToken: token, updatedAt: Date.now() },
    { merge: true }
  );

  return token;
}
