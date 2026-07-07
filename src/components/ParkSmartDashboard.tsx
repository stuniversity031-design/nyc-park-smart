"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  current: {
    main: { temp: number; humidity: number };
    weather: { main: string; description: string }[];
    name: string;
    sys: { sunrise: number; sunset: number };
  };
  forecast: {
    list: { dt_txt: string; main: { temp: number }; weather: { main: string }[] }[];
  };
}

interface AspData {
  suspendedToday: boolean;
  suspensionReason: string | null;
  nextSuspension: { date: string; reason: string } | null;
  standardSchedule: { days: string[]; time: string };
}

export default function ParkSmartDashboard() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [asp, setAsp] = useState<AspData | null>(null);
  const [routeSuggestion, setRouteSuggestion] = useState<string>("Loading today's route...");
  const [selectedVehicle, setSelectedVehicle] = useState("2003 Jaguar");
  const [zipInput, setZipInput] = useState("");
  const [activeZip, setActiveZip] = useState("11237");
  const [locationName, setLocationName] = useState("Bushwick, Brooklyn");
  const [coords, setCoords] = useState({ lat: 40.7831, lon: -73.9712 });
  const [exitModalOpen, setExitModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
  fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`)
    .then((res) => res.json())
    .then((data) => setWeather(data))
    .catch(() => {});

  fetch("/api/asp-schedule")
    .then((res) => res.json())
    .then((data) => setAsp(data))
    .catch(() => {});

  fetch("/api/route-suggestion")
    .then((res) => res.json())
    .then((data) => setRouteSuggestion(data.suggestion))
    .catch(() => setRouteSuggestion("Route suggestion unavailable."));
}, [coords]);

const handleZipSearch = async () => {
  if (!zipInput || zipInput.length < 5) return;
  try {
    const res = await fetch(`/api/geocode?zip=${zipInput}`);
    const data = await res.json();
    if (data.lat && data.lon) {
      setCoords({ lat: data.lat, lon: data.lon });
      setLocationName(data.placeName);
      setActiveZip(zipInput);
      setRouteSuggestion("Loading today's route...");
    }
  } catch {
    setLocationName("Zip code not found");
  }
};


  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      setExitModalOpen(true);
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const hour = time.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const hourlyForecast = weather?.forecast?.list?.slice(0, 6) || [];
  return (
    <div style={{ background: "#1A1C1E", color: "#fff", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>

      {/* NOTIFICATION BAR */}
      <div style={{ background: "#F7C600", color: "#1A1C1E", fontSize: "12px", fontWeight: 700, padding: "8px 24px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Live: ASP suspended today — {asp?.suspensionReason || "checking..."} · Next suspension {asp?.nextSuspension?.date}
      </div>

      {/* HERO */}
      <div style={{ padding: "32px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: "13px", color: "#F7C600", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {greeting}
        </div>
        <div style={{ fontSize: "40px", fontWeight: 800 }}>Michael</div>
        <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginTop: "8px", maxWidth: "480px", lineHeight: 1.6 }}>
          Today's parking situation is looking good. {asp?.suspendedToday ? `ASP is suspended today for ${asp.suspensionReason}.` : "Standard alternate side rules are in effect."}
        </div>
        <div style={{ fontSize: "32px", fontWeight: 300, marginTop: "16px" }}>
          {mounted ? time.toLocaleTimeString() : "--:--:--"}
        </div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
  {mounted ? time.toDateString() : ""} · {locationName}
</div>

<div style={{ display: "flex", gap: "8px", marginTop: "16px", maxWidth: "320px" }}>
  <input
    type="text"
    value={zipInput}
    onChange={(e) => setZipInput(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && handleZipSearch()}
    placeholder="Enter NYC zip code"
    style={{
      flex: 1,
      padding: "10px 12px",
      borderRadius: "2px",
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      fontSize: "13px",
      outline: "none",
    }}
  />
  <button
    onClick={handleZipSearch}
    style={{
      background: "#F7C600",
      color: "#1A1C1E",
      fontWeight: 700,
      fontSize: "12px",
      padding: "10px 16px",
      border: "none",
      borderRadius: "2px",
      cursor: "pointer",
    }}
  >
    Search
  </button>
</div>
      </div>

      {/* TILE GRID */}
      <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "14px" }}>

        {/* ASP TILE */}
        <div style={{ gridColumn: "span 4", background: "#0057A8", borderRadius: "4px", padding: "20px", minHeight: "260px" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.6 }}>
            Alternate Side Parking
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "10px" }}>
            {asp?.suspendedToday
              ? `Suspended today — ${asp.suspensionReason}`
              : `In effect — ${asp?.standardSchedule.days.join(" & ")} ${asp?.standardSchedule.time}`}
          </div>
          {asp?.nextSuspension && (
            <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "6px" }}>
              Next suspension: {asp.nextSuspension.date} ({asp.nextSuspension.reason})
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
            {["2019 Accord", "2021 RAV4"].map((v) => (
              <div
                key={v}
                onClick={() => setSelectedVehicle(v)}
                style={{
                  padding: "5px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  borderRadius: "2px",
                  cursor: "pointer",
                  background: selectedVehicle === v ? "#F7C600" : "rgba(255,255,255,0.12)",
                  color: selectedVehicle === v ? "#1A1C1E" : "#fff",
                }}
              >
                {v}
              </div>
            ))}
          </div>
        </div>

        {/* WEATHER TILE */}
        <div style={{ gridColumn: "span 4", background: "linear-gradient(135deg,#0057A8,#003d7a)", borderRadius: "4px", padding: "20px", minHeight: "260px" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.6 }}>
            Weather Intelligence
          </div>
          <div style={{ fontSize: "56px", fontWeight: 300, marginTop: "8px" }}>
            {weather ? Math.round(weather.current.main.temp) : "--"}°
          </div>
          <div style={{ fontSize: "13px", opacity: 0.75 }}>
            {weather?.current.weather[0]?.description || "Loading..."} · {weather?.current.name}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", overflowX: "auto" }}>
            {hourlyForecast.map((h, i) => (
              <div key={i} style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", borderRadius: "2px", padding: "6px 10px", flexShrink: 0 }}>
                <div style={{ fontSize: "9px", opacity: 0.5 }}>{h.dt_txt.split(" ")[1].slice(0, 5)}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "4px" }}>{Math.round(h.main.temp)}°</div>
              </div>
            ))}
          </div>
        </div>

        {/* SMART ROUTE TILE */}
        <div style={{ gridColumn: "span 4", background: "#242628", borderRadius: "4px", padding: "20px", minHeight: "260px" }}>
          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Today's Smart Route
          </div>
          <div style={{ fontSize: "14px", marginTop: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.85)" }}>
            {routeSuggestion}
          </div>
        </div>
         {/* GARAGE FINDER */}
        <div style={{ gridColumn: "span 4", background: "#242628", borderRadius: "4px", padding: "20px" }}>
          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
            Garage Finder
          </div>
          {[
            { name: "Icon Parking — W 75th St", rate: "$18/hr", dist: "0.2 mi" },
            { name: "QuickPark — W 72nd St", rate: "$14/hr", dist: "0.4 mi" },
            { name: "Central Park Garage", rate: "$22/hr", dist: "0.5 mi" },
          ].map((g, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{g.name}</div>
                <div style={{ fontSize: "11px", color: "#2ECC71" }}>Open Now · {g.dist}</div>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700 }}>{g.rate}</div>
            </div>
          ))}
        </div>

        {/* METER LOCATOR */}
        <div style={{ gridColumn: "span 4", background: "#242628", borderRadius: "4px", padding: "20px" }}>
          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
            Parking Meter Locator
          </div>
          {[
            { street: "W 74th St (North)", hours: "Mon–Sat 8am–7pm", dist: "0.1 mi" },
            { street: "Amsterdam Ave", hours: "Mon–Sat 8am–10pm", dist: "0.2 mi" },
            { street: "W 72nd St (South)", hours: "Mon–Sat 8am–7pm", dist: "0.3 mi" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none", fontSize: "12px" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{m.street}</div>
                <div style={{ fontSize: "10px", color: "#888" }}>{m.hours}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#F7C600", fontWeight: 700 }}>$3.50/hr</div>
                <div style={{ fontSize: "10px", color: "#888" }}>{m.dist}</div>
              </div>
            </div>
          ))}
        </div>

        {/* MARKET + NEWS */}
        <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#242628", borderRadius: "4px", padding: "16px" }}>
            <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
              Market Snapshot
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { t: "DOW", v: "42,918", c: "+0.34%", up: true },
                { t: "NASDAQ", v: "19,462", c: "+0.61%", up: true },
                { t: "BTC", v: "$107,240", c: "-1.2%", up: false },
                { t: "GOLD", v: "$3,287", c: "+0.18%", up: true },
              ].map((m, i) => (
                <div key={i} style={{ background: "#2E3033", borderRadius: "2px", padding: "8px" }}>
                  <div style={{ fontSize: "9px", color: "#888" }}>{m.t}</div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{m.v}</div>
                  <div style={{ fontSize: "10px", color: m.up ? "#2ECC71" : "#E74C3C" }}>{m.c}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#242628", borderRadius: "4px", padding: "16px", flex: 1 }}>
            <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
              NYC Headlines
            </div>
            {[
              { src: "NYC DOT", h: "ASP suspended Thursday for Eid al-Adha holiday" },
              { src: "MTA", h: "A/C/E delays due to signal issues at 42nd St" },
              { src: "City Hall", h: "Mayor announces expanded meter hours" },
            ].map((n, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <div style={{ fontSize: "9px", color: "#1A7FD4", fontWeight: 700 }}>{n.src}</div>
                <div style={{ fontSize: "12px", marginTop: "2px" }}>{n.h}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* EXIT MODAL */}
      {exitModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,11,12,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#242628", padding: "32px", maxWidth: "420px", borderRadius: "4px", borderTop: "3px solid #F7C600" }}>
            <div style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Leaving already?</div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "20px", lineHeight: 1.6 }}>
              Are you sure you know today's Alternate Side Parking schedule?
            </div>
            <button onClick={() => setExitModalOpen(false)} style={{ background: "#F7C600", color: "#1A1C1E", fontWeight: 700, padding: "10px 16px", borderRadius: "2px", border: "none", cursor: "pointer" }}>
              Review Schedule
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
