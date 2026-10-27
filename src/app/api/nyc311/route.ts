import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get("zip") || "11237";

  try {
    const res = await axios.get(
      "https://data.cityofnewyork.us/resource/erm2-nwe9.json",
      {
        params: {
          incident_zip: zip,
          $limit: 10,
          $order: "created_date DESC",
          $where: `complaint_type IN('Illegal Parking','Blocked Driveway','Abandoned Vehicle','Fire Hydrant','No Parking - Street Cleaning')`,
        },
      }
    );

    const complaints = res.data.map((c: any) => ({
      type: c.complaint_type,
      description: c.descriptor,
      address: c.incident_address,
      status: c.status,
      date: c.created_date,
      borough: c.borough,
    }));

    return NextResponse.json({ complaints });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch 311 data", details: err.message },
      { status: 500 }
    );
  }
}
