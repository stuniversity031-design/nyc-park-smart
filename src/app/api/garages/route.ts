import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

function miles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip") || "";
  const lat = parseFloat(searchParams.get("lat") || "");
  const lon = parseFloat(searchParams.get("lon") || "");
  const token = process.env.NYC_OPEN_DATA_TOKEN;

  if (!/^\d{5}$/.test(zip) || Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Invalid zip or coordinates" }, { status: 400 });
  }

  try {
    const res = await axios.get(
      "https://data.cityofnewyork.us/resource/w7w3-xahh.json",
      {
        headers: token ? { "X-App-Token": token } : {},
        params: {
          $limit: 600,
          $where: `license_status='Active' AND business_category='Garage & Parking Lot' AND address_zip like '${zip.slice(0, 3)}%'`,
          $select:
            "business_name,dba_trade_name,address_building,address_street_name,address_zip,address_borough,latitude,longitude",
        },
        timeout: 8000,
      }
    );

    const garages = res.data
      .map((g: any) => {
        const glat = parseFloat(g.latitude);
        const glon = parseFloat(g.longitude);
        if (Number.isNaN(glat) || Number.isNaN(glon)) return null;
        return {
          name: g.dba_trade_name || g.business_name,
          address: `${g.address_building || ""} ${(g.address_street_name || "").replace(/\s+/g, " ")}`.trim(),
          zip: g.address_zip,
          borough: g.address_borough,
          distance: Math.round(miles(lat, lon, glat, glon) * 100) / 100,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, 5);

    return NextResponse.json({ garages });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch garage data", details: err.message },
      { status: 500 }
    );
  }
}
