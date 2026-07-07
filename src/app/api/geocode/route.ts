import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip");
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!zip) {
    return NextResponse.json({ error: "Missing zip code" }, { status: 400 });
  }
  if (!token) {
    return NextResponse.json({ error: "Missing Mapbox token" }, { status: 500 });
  }

  try {
    const res = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${zip}.json`,
      {
        params: {
          access_token: token,
          country: "US",
          types: "postcode",
        },
      }
    );

    const feature = res.data.features?.[0];
    if (!feature) {
      return NextResponse.json({ error: "Zip code not found" }, { status: 404 });
    }

    const [lon, lat] = feature.center;
    const contextText = feature.place_name || "";

    return NextResponse.json({
      lat,
      lon,
      placeName: contextText,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Geocoding failed", details: err.message },
      { status: 500 }
    );
  }
}
