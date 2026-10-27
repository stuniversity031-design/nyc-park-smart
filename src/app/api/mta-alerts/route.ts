import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const res = await axios.get(
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json",
      {
      }
    );

    const entities = res.data?.entity || [];

    const alerts = entities.slice(0, 8).map((e: any) => {
      const alert = e.alert;
      const header =
        alert?.header_text?.translation?.[0]?.text || "Service Alert";
      const description =
        alert?.description_text?.translation?.[0]?.text || "";
      const routes = alert?.informed_entity
        ?.map((ie: any) => ie.route_id)
        .filter(Boolean)
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
        .join(", ");

      return {
        header,
        description: description.slice(0, 120),
        routes: routes || "Multiple lines",
      };
    });

    return NextResponse.json({ alerts });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch MTA alerts", details: err.message },
      { status: 500 }
    );
  }
}
