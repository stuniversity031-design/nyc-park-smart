import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "40.7549");
  const lon = parseFloat(searchParams.get("lon") || "-73.9840");
  const token = process.env.NYC_OPEN_DATA_TOKEN;

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const res = await axios.get(
      "https://data.cityofnewyork.us/resource/693u-uax6.json",
      {
        headers: token ? { "X-App-Token": token } : {},
        params: {
          $limit: 40,
          $where: `status='Active' AND within_circle(location,${lat},${lon},400)`,
          $select: "on_street,from_street,to_street,meter_hours,borough",
        },
        timeout: 8000,
      }
    );

    const seen = new Set<string>();
    const meters: { street: string; between: string; hours: string; borough: string }[] = [];
    for (const m of res.data) {
      const key = `${m.on_street}|${m.from_street}|${m.to_street}|${m.meter_hours}`;
      if (seen.has(key)) continue;
      seen.add(key);
      meters.push({
        street: m.on_street,
        between: `${m.from_street} & ${m.to_street}`,
        hours: m.meter_hours || "See posted sign",
        borough: m.borough,
      });
      if (meters.length === 6) break;
    }

    return NextResponse.json({ meters });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch meter data", details: err.message },
      { status: 500 }
    );
  }
}
