"use client";

import { useState } from "react";
import { getIdToken } from "@/features/loan/services/session";
// Test component to create a loan via CoinRabbit API
export default function CreateLoanTest() {
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);

  const run = async () => {
    setErr(null);
    setOut(null);
    try {
      const idToken = await getIdToken();

      const res = await fetch("/api/coinrabbit/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          deposit: {
            currency_code: "BTC",
            currency_network: "BTC",
            expected_amount: "1",
          },
          loan: {
            currency_code: "USDT",
            currency_network: "ETH",
          },
          ltv_percent: "0.65",
        }),
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
      setOut({ status: res.status, data: json });
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={run}>Test CREATE</button>
      {out && <pre>{JSON.stringify(out, null, 2)}</pre>}
      {err && <pre style={{ color: "red" }}>{err}</pre>}
    </div>
  );
}
