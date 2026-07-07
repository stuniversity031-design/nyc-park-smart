import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const CORRIDORS = [
  {
    name: "BQE (Brooklyn-Queens Expressway)",
    coords: "-73.9903,40.6892;-73.9442,40.7282",
  },
  {
    name: "LIE (Long Island Expressway)",
    coords: "-73.8550,40.7423;-73.7949,40.7282",
  },
  {
    name: "Atlantic Avenue",
    coords: "-73.9876,40.6892;-73.9028,40.6782",
  },
  {
    name: "Van Wyck Expressway",
    coords: "-73.8228,40.7282;-73.7781,40.6595",
  },
];

export async function GET(req: NextRequest) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "Missing Mapbox token" }, { status: 500 });
  }

  try {
    const results = await Promise.all(
      CORRIDORS.map(async (corridor) => {
        const res = await axios.get(
          `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${corridor.coords}`,
          {
            params: {
              access_token: token,
              annotations: "congestion",
              overview: "full",
            },
          }
        );

        const route = res.data.routes?.[0];
        const congestionLevels: string[] = route?.legs?.[0]?.annotation?.congestion || [];

        const heavyCount = congestionLevels.filter(
          (c) => c === "heavy" || c === "severe"
        ).length;
        const totalCount = congestionLevels.length || 1;
        const heavyRatio = heavyCount / totalCount;

        let status = "light";
        if (heavyRatio > 0.5) status = "heavy";
        else if (heavyRatio > 0.2) status = "moderate";

        return {
          corridor: corridor.name,
          status,
          durationMin: route ? Math.round(route.duration / 60) : null,
        };
      })
    );

    return NextResponse.json({ corridors: results });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Traffic fetch failed", details: err.message },
      { status: 500 }
    );
  }
}
