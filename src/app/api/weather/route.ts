import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") || "40.7831";
  const lon = searchParams.get("lon") || "-73.9712";
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing OpenWeather API key" }, { status: 500 });
  }

  try {
    const [current, forecast] = await Promise.all([
      axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: { lat, lon, appid: apiKey, units: "imperial" },
      }),
      axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
        params: { lat, lon, appid: apiKey, units: "imperial" },
      }),
    ]);

    return NextResponse.json({
      current: current.data,
      forecast: forecast.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch weather data", details: err.message },
      { status: 500 }
    );
  }
}
