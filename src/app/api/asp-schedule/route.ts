import { NextResponse } from "next/server";

// Source: NYC DOT 2026 Alternate Side Parking Suspension Calendar
// https://www.nyc.gov/html/dot/html/motorist/alternate-side-parking.shtml
const ASP_SUSPENSIONS_2026 = [
  { date: "2026-01-01", reason: "New Year's Day" },
  { date: "2026-01-06", reason: "Three Kings' Day" },
  { date: "2026-01-19", reason: "Martin Luther King Jr. Day" },
  { date: "2026-02-12", reason: "Lincoln's Birthday" },
  { date: "2026-02-16", reason: "Presidents' Day and Lunar New Year's Eve" },
  { date: "2026-02-17", reason: "Lunar New Year" },
  { date: "2026-02-18", reason: "Ash Wednesday and Losar" },
  { date: "2026-03-03", reason: "Purim" },
  { date: "2026-03-20", reason: "Eid al-Fitr" },
  { date: "2026-03-21", reason: "Eid al-Fitr" },
  { date: "2026-04-02", reason: "Holy Thursday and Passover" },
  { date: "2026-04-03", reason: "Good Friday and Passover" },
  { date: "2026-04-08", reason: "Passover (7th day)" },
  { date: "2026-04-09", reason: "Passover (8th day) and Orthodox Holy Thursday" },
  { date: "2026-04-10", reason: "Orthodox Good Friday" },
  { date: "2026-05-14", reason: "Solemnity of the Ascension" },
  { date: "2026-05-22", reason: "Shavuoth (1st day)" },
  { date: "2026-05-23", reason: "Shavuoth (2nd day)" },
  { date: "2026-05-25", reason: "Memorial Day" },
  { date: "2026-05-27", reason: "Eid al-Adha" },
  { date: "2026-05-28", reason: "Eid al-Adha" },
  { date: "2026-06-19", reason: "Juneteenth" },
  { date: "2026-07-03", reason: "Independence Day" },
  { date: "2026-07-04", reason: "Independence Day" },
  { date: "2026-07-23", reason: "Tisha B'Av" },
  { date: "2026-08-15", reason: "Feast of the Assumption" },
  { date: "2026-09-07", reason: "Labor Day" },
  { date: "2026-09-12", reason: "Rosh Hashanah" },
  { date: "2026-09-13", reason: "Rosh Hashanah" },
  { date: "2026-09-21", reason: "Yom Kippur" },
  { date: "2026-09-26", reason: "Succoth (1st day)" },
  { date: "2026-09-27", reason: "Succoth (2nd day)" },
  { date: "2026-10-03", reason: "Shemini Atzereth" },
  { date: "2026-10-04", reason: "Simchas Torah" },
  { date: "2026-10-12", reason: "Columbus Day" },
  { date: "2026-11-01", reason: "All Saints' Day" },
  { date: "2026-11-03", reason: "Election Day" },
  { date: "2026-11-08", reason: "Diwali" },
  { date: "2026-11-11", reason: "Veterans Day" },
  { date: "2026-11-26", reason: "Thanksgiving Day" },
  { date: "2026-12-08", reason: "Immaculate Conception" },
  { date: "2026-12-25", reason: "Christmas Day" },
];

export async function GET() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());

  const suspension = ASP_SUSPENSIONS_2026.find((s) => s.date === today);
  const nextSuspension = ASP_SUSPENSIONS_2026.find((s) => s.date > today);

  return NextResponse.json({
    suspendedToday: !!suspension,
    suspensionReason: suspension?.reason ?? null,
    nextSuspension: nextSuspension ?? null,
    standardSchedule: {
      days: ["Check your posted street sign"],
      time: "rules vary by block",
    },
    note: "Holiday dates from the NYC DOT 2026 calendar. Weather and emergency suspensions are announced separately: check NYC 311.",
  });
}
