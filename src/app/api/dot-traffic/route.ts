import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const res = await axios.get(
      "https://data.cityofnewyork.us/resource/i4gi-tjb9.json",
      {
        params: {
          $limit: 20,
          $order: "data_as_of DESC",
        },
      }
    );

    const speeds = res.data.map((s: any) => ({
      id: s.id,
      name: s.link_name || s.id,
      speed: parseFloat(s.speed) || 0,
      travelTime: parseFloat(s.travel_time) || 0,
      status: parseFloat(s.speed) < 10
        ? "heavy"
        : parseFloat(s.speed) < 20
        ? "moderate"
        : "light",
      borough: s.borough || "NYC",
    }));

    const sorted = speeds.sort((a: any, b: any) => a.speed - b.speed);

    return NextResponse.json({ speeds: sorted.slice(0, 12) });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch DOT traffic data", details: err.message },
      { status: 500 }
    );
  }
}
