import { NextResponse } from "next/server";

// NYC DOT Alternate Side Parking rules (simplified static ruleset)
// In production this would pull from NYC Open Data ASP calendar API
const ASP_SUSPENSIONS_2026 = [
  { date: "2026-06-30", reason: "Eid al-Adha" },
  { date: "2026-07-04", reason: "Independence Day" },
  { date: "2026-09-07", reason: "Labor Day" },
];

export async function GET() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const suspension = ASP_SUSPENSIONS_2026.find((s) => s.date === todayStr);
  const nextSuspension = ASP_SUSPENSIONS_2026.find(
    (s) => new Date(s.date) > today
  );

  return NextResponse.json({
    suspendedToday: !!suspension,
    suspensionReason: suspension?.reason || null,
    nextSuspension: nextSuspension || null,
    standardSchedule: {
      days: ["Monday", "Thursday"],
      time: "11:00 AM - 12:30 PM",
    },
  });
}
