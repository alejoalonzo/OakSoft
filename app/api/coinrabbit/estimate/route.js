import { NextResponse } from "next/server";

export async function GET(req) {
  const url = new URL(req.url);
  const p = url.searchParams;

  const from_code = p.get("from_code");
  const from_network = p.get("from_network");
  const to_code = p.get("to_code");
  const to_network = p.get("to_network");
  const amount = p.get("amount");
  const exchange = p.get("exchange") || "direct";

  // Acepta 'ltv' (50/65/80/90) o 'ltv_percent' (0.5/0.65/0.8/0.9)
  let ltv_percent;
  if (p.has("ltv_percent")) ltv_percent = Number(p.get("ltv_percent"));
  else if (p.has("ltv")) ltv_percent = Number(p.get("ltv")) / 100;
  else ltv_percent = 0.65;

  if (!from_code || !from_network || !to_code || !to_network || !amount) {
    return NextResponse.json(
      { result: false, error: "Missing params" },
      { status: 400 }
    );
  }

  const qs = new URLSearchParams({
    from_code,
    from_network,
    to_code,
    to_network,
    amount,
    exchange,
  });
  if (!Number.isNaN(ltv_percent)) qs.append("ltv_percent", String(ltv_percent));

  const upstream = `https://api.coinrabbit.io/v2/loans/estimate?${qs.toString()}`;

  try {
    const r = await fetch(upstream, {
      headers: { "x-api-key": process.env.COINRABBIT_API_KEY },
      cache: "no-store",
    });
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch (err) {
    return NextResponse.json(
      { result: false, error: err.message },
      { status: 500 }
    );
  }
}
