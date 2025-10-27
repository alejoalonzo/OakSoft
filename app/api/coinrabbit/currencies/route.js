import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const is_enabled = searchParams.get("is_enabled") ?? "null"; // "null" => todas

  const url = `${process.env.COINRABBIT_BASE_URL}/currencies?is_enabled=${encodeURIComponent(is_enabled)}`;

  const res = await fetch(url, {
    headers: {
      "x-api-key": process.env.COINRABBIT_API_KEY,
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    return NextResponse.json(
      { error: `CoinRabbit ${res.status}`, details: txt },
      { status: 500 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
