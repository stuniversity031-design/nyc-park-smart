import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);
    const d = await res.json();

    const rows = [
      { t: "BTC", o: d.bitcoin },
      { t: "ETH", o: d.ethereum },
    ].filter((r) => r.o && typeof r.o.usd === "number");

    const items = rows.map((r) => {
      const ch: number = r.o.usd_24h_change ?? 0;
      return {
        t: r.t,
        v: "$" + r.o.usd.toLocaleString("en-US", { maximumFractionDigits: 0 }),
        c: `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`,
        up: ch >= 0,
      };
    });

    return NextResponse.json({ items, updatedAt: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch market data", details: err.message },
      { status: 500 }
    );
  }
}
