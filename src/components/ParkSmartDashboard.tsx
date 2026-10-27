"use client";

import { useEffect, useState, useRef } from "react";
import { getBoroughFromZip, GARAGES, METERS, Borough } from "@/lib/boroughData";

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
interface TrafficCorridor {
  corridor: string;
  status: string;
  durationMin: number;
}
interface Complaint {
  type: string;
  address: string;
  status: string;
  date: string;
}
interface MtaAlert {
  header: string;
  routes: string;
}
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ParkSmartDashboard() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [asp, setAsp] = useState<AspData | null>(null);
  const [routeSuggestion, setRouteSuggestion] = useState("Loading today's route...");
  const [traffic, setTraffic] = useState<TrafficCorridor[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [mtaAlerts, setMtaAlerts] = useState<MtaAlert[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("2003 Jaguar");
  const [zipInput, setZipInput] = useState("");
  const [activeZip, setActiveZip] = useState("10001");
  const [locationName, setLocationName] = useState("Midtown, Manhattan");
  const [coords, setCoords] = useState({ lat: 40.7549, lon: -73.9840 });
  const [borough, setBorough] = useState<Borough>("Manhattan");
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I am your NYC Park Smart assistant. Ask me anything about parking, traffic, MTA alerts, or street rules in your area." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAllData(coords, activeZip);
  }, [coords, activeZip]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      setExitModalOpen(true);
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const fetchAllData = async (c: { lat: number; lon: number }, zip: string) => {
    setRouteSuggestion("Loading today's route...");
    try {
      const [weatherRes, aspRes, routeRes, trafficRes, complaints311Res, mtaRes] = await Promise.all([
        fetch(`/api/weather?lat=${c.lat}&lon=${c.lon}`).then(r => r.json()),
        fetch("/api/asp-schedule").then(r => r.json()),
        fetch("/api/route-suggestion").then(r => r.json()),
        fetch("/api/traffic").then(r => r.json()),
        fetch(`/api/nyc311?zip=${zip}`).then(r => r.json()),
        fetch("/api/mta-alerts").then(r => r.json()),
      ]);
      setWeather(weatherRes);
      setAsp(aspRes);
      setRouteSuggestion(routeRes.suggestion || "Route suggestion unavailable.");
      setTraffic(trafficRes.corridors || []);
      setComplaints(complaints311Res.complaints || []);
      setMtaAlerts(mtaRes.alerts || []);
    } catch (err) {
      setRouteSuggestion("Route suggestion unavailable.");
    }
  };

  const handleZipSearch = async () => {
    if (!zipInput || zipInput.length < 5) return;
    try {
      const res = await fetch(`/api/geocode?zip=${zipInput}`);
      const data = await res.json();
      if (data.lat && data.lon) {
        const newBorough = getBoroughFromZip(zipInput);
        setCoords({ lat: data.lat, lon: data.lon });
        setLocationName(data.placeName);
        setActiveZip(zipInput);
        setBorough(newBorough);
      }
    } catch {
      setLocationName("Zip code not found");
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const bqe = traffic.find(t => t.corridor.includes("BQE"));
      const lie = traffic.find(t => t.corridor.includes("LIE"));
      const atlantic = traffic.find(t => t.corridor.includes("Atlantic"));
      const vanWyck = traffic.find(t => t.corridor.includes("Van Wyck"));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          context: {
            locationName,
            zip: activeZip,
            borough,
            weather: weather ? `${Math.round(weather.current.main.temp)}F, ${weather.current.weather[0]?.description}` : "Unknown",
            aspStatus: asp?.suspendedToday ? `Suspended - ${asp.suspensionReason}` : "No holiday suspension today. Rules vary by block, check the posted sign.",
            nextSuspension: asp?.nextSuspension ? `${asp.nextSuspension.date} (${asp.nextSuspension.reason})` : "None upcoming",
            bqeStatus: bqe ? `${bqe.status} (${bqe.durationMin} min)` : "Unknown",
            lieStatus: lie ? `${lie.status} (${lie.durationMin} min)` : "Unknown",
            atlanticStatus: atlantic ? `${atlantic.status} (${atlantic.durationMin} min)` : "Unknown",
            vanWyckStatus: vanWyck ? `${vanWyck.status} (${vanWyck.durationMin} min)` : "Unknown",
          },
        }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I could not process that. Please try again." }]);
    }
    setChatLoading(false);
  };

  const hour = time.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const hourlyForecast = weather?.forecast?.list?.slice(0, 6) || [];
  const garages = GARAGES[borough] || GARAGES["Unknown"];
  const meters = METERS[borough] || METERS["Unknown"];
  const statusColor = (s: string) => s === "heavy" ? "#E74C3C" : s === "moderate" ? "#F7C600" : "#2ECC71";

return (
    <div style={{ background: "#1A1C1E", color: "#fff", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>

      {/* NOTIFICATION BAR */}
      <div style={{ background: "#F7C600", color: "#1A1C1E", fontSize: "12px", fontWeight: 700, padding: "8px 24px", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", gap: "16px", alignItems: "center" }}>
        <span style={{ background: "#1A1C1E", color: "#F7C600", padding: "2px 8px", fontSize: "9px", fontWeight: 800, letterSpacing: "0.15em" }}>LIVE</span>
        <span>ASP {asp?.suspendedToday ? `SUSPENDED — ${asp.suspensionReason}` : "NO HOLIDAY SUSPENSION"} · Next suspension: {asp?.nextSuspension?.date || "TBD"} · {borough} · {mounted ? time.toLocaleTimeString() : "--:--:--"}</span>
      </div>

      {/* HERO */}
      <div style={{ padding: "32px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(180deg, #1e2024 0%, #1A1C1E 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "13px", color: "#F7C600", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{greeting}</div>
            <div style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-0.02em" }}>Michael</div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginTop: "6px", maxWidth: "480px", lineHeight: 1.6 }}>
              {asp?.suspendedToday ? `ASP is suspended today for ${asp.suspensionReason}.` : "Standard alternate side rules are in effect."} {weather ? `${Math.round(weather.current.main.temp)}°F in ${borough}.` : ""}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px", maxWidth: "340px" }}>
              <input
                type="text"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleZipSearch()}
                placeholder="Enter NYC zip code..."
                style={{ flex: 1, padding: "10px 14px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "13px", outline: "none" }}
              />
              <button onClick={handleZipSearch} style={{ background: "#F7C600", color: "#1A1C1E", fontWeight: 800, fontSize: "11px", padding: "10px 16px", border: "none", borderRadius: "2px", cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>Search</button>
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "8px" }}>{locationName} · {borough}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "48px", fontWeight: 300, letterSpacing: "-0.03em" }}>{mounted ? time.toLocaleTimeString() : "--:--:--"}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>{mounted ? time.toDateString() : ""}</div>
          </div>
        </div>
      </div>

      {/* TILE GRID */}
      <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: "14px" }}>

        {/* ASP */}
        <div style={{ gridColumn: "span 4", background: "#0057A8", borderRadius: "4px", padding: "20px", borderTop: "3px solid #F7C600" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.6, marginBottom: "8px" }}>Alternate Side Parking</div>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>{asp?.suspendedToday ? `Suspended — ${asp.suspensionReason}` : "No holiday suspension today. Check your posted street sign."}</div>
          {asp?.nextSuspension && <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "6px" }}>Next suspension: {asp.nextSuspension.date} ({asp.nextSuspension.reason})</div>}
          <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
            {["2003 Jaguar", "2019 Accord"].map(v => (
              <div key={v} onClick={() => setSelectedVehicle(v)} style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "2px", cursor: "pointer", background: selectedVehicle === v ? "#F7C600" : "rgba(255,255,255,0.12)", color: selectedVehicle === v ? "#1A1C1E" : "#fff" }}>{v}</div>
            ))}
          </div>
        </div>

        {/* WEATHER */}
        <div style={{ gridColumn: "span 4", background: "linear-gradient(135deg,#0057A8,#003d7a)", borderRadius: "4px", padding: "20px", borderTop: "3px solid #1A7FD4" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.6, marginBottom: "8px" }}>Weather Intelligence · {borough}</div>
          <div style={{ fontSize: "56px", fontWeight: 300 }}>{weather ? Math.round(weather.current.main.temp) : "--"}°</div>
          <div style={{ fontSize: "13px", opacity: 0.75 }}>{weather?.current.weather[0]?.description} · Humidity {weather?.current.main.humidity}%</div>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px", overflowX: "auto" }}>
            {hourlyForecast.map((h, i) => (
              <div key={i} style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", borderRadius: "2px", padding: "6px 10px", flexShrink: 0 }}>
                <div style={{ fontSize: "9px", opacity: 0.5 }}>{h.dt_txt.split(" ")[1].slice(0,5)}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "4px" }}>{Math.round(h.main.temp)}°</div>
              </div>
            ))}
          </div>
        </div>

        {/* SMART ROUTE */}
        <div style={{ gridColumn: "span 4", background: "#242628", borderRadius: "4px", padding: "20px", borderTop: "3px solid #2ECC71" }}>
          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>Today's Smart Route · AI-Powered</div>
          <div style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.85)" }}>{routeSuggestion}</div>
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {traffic.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", borderLeft: `2px solid ${statusColor(t.status)}` }}>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{t.corridor.split("(")[0].trim()}</span>
                <span style={{ color: statusColor(t.status), fontWeight: 700, textTransform: "uppercase" }}>{t.status} · {t.durationMin}min</span>
              </div>
            ))}
          </div>
        </div>

        {/* GARAGE FINDER */}
        <div style={{ gridColumn: "span 4", background: "#242628", borderRadius: "4px", padding: "20px", borderTop: "3px solid #F7C600" }}>
          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Garage Finder · {borough}</div>
          {garages.map((g, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < garages.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{g.name}</div>
                <div style={{ fontSize: "10px", color: "#2ECC71", marginTop: "2px" }}>Open · {g.dist} · {g.hours}</div>
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#F7C600" }}>{g.rate}</div>
            </div>
          ))}
        </div>

        {/* METERS */}
        <div style={{ gridColumn: "span 4", background: "#242628", borderRadius: "4px", padding: "20px", borderTop: "3px solid #4A4D52" }}>
          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>Parking Meters · {borough}</div>
          {meters.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < meters.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", fontSize: "12px" }}>
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

        {/* NYC 311 */}
        <div style={{ gridColumn: "span 4", background: "#242628", borderRadius: "4px", padding: "20px", borderTop: "3px solid #E85D04" }}>
          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>NYC 311 · Parking Complaints · {activeZip}</div>
          {complaints.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#888" }}>No recent complaints in this area.</div>
          ) : complaints.slice(0, 4).map((c, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize: "11px", color: "#E85D04", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.type}</div>
              <div style={{ fontSize: "12px", marginTop: "2px" }}>{c.address}</div>
              <div style={{ fontSize: "10px", color: "#888", marginTop: "1px" }}>{new Date(c.date).toLocaleDateString()}</div>
            </div>
          ))}
        </div>

        {/* MTA ALERTS */}
        <div style={{ gridColumn: "span 6", background: "#242628", borderRadius: "4px", padding: "20px", borderTop: "3px solid #1A7FD4" }}>
          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>MTA Service Alerts · Live</div>
          {mtaAlerts.length === 0 ? (
            <div style={{ fontSize: "12px", color: "#888" }}>No active alerts at this time.</div>
          ) : mtaAlerts.slice(0, 4).map((a, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize: "10px", color: "#1A7FD4", fontWeight: 700, marginBottom: "3px" }}>Lines: {a.routes}</div>
              <div style={{ fontSize: "12px", lineHeight: 1.5 }}>{a.header}</div>
            </div>
          ))}
        </div>

        {/* MARKET + NEWS */}
        <div style={{ gridColumn: "span 6", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#242628", borderRadius: "4px", padding: "16px", borderTop: "3px solid #1A7FD4" }}>
            <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>Market Snapshot</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
              {[
                { t: "DOW", v: "42,918", c: "+0.34%", up: true },
                { t: "NASDAQ", v: "19,462", c: "+0.61%", up: true },
                { t: "BTC", v: "$107K", c: "-1.2%", up: false },
                { t: "GOLD", v: "$3,287", c: "+0.18%", up: true },
              ].map((m, i) => (
                <div key={i} style={{ background: "#2E3033", borderRadius: "2px", padding: "8px" }}>
                  <div style={{ fontSize: "9px", color: "#888" }}>{m.t}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{m.v}</div>
                  <div style={{ fontSize: "10px", color: m.up ? "#2ECC71" : "#E74C3C" }}>{m.c}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#242628", borderRadius: "4px", padding: "16px", flex: 1, borderTop: "3px solid #E85D04" }}>
            <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>NYC Headlines</div>
            {[
              { src: "NYC DOT", h: `ASP ${asp?.suspendedToday ? "suspended today" : "not suspended for a holiday"} — ${asp?.suspendedToday ? asp.suspensionReason : "check your posted sign"}` },
              { src: "MTA", h: mtaAlerts[0]?.header || "Checking for alerts..." },
              { src: "311", h: complaints[0] ? `${complaints[0].type} reported at ${complaints[0].address}` : "No recent complaints" },
            ].map((n, i) => (
              <div key={i} style={{ padding: "7px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ fontSize: "9px", color: "#1A7FD4", fontWeight: 700 }}>{n.src}</div>
                <div style={{ fontSize: "12px", marginTop: "2px" }}>{n.h}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div style={{ background: "#242628", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "28px 32px", textAlign: "center" }}>
        <div style={{ fontSize: "16px", fontWeight: 800, color: "#F7C600" }}>NYC Park Smart™</div>
        <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>The Intelligent Parking Companion Built for New York City Residents</div>
        <div style={{ fontSize: "11px", color: "#6E7278", marginTop: "12px" }}>Powered by Creative Marketing Agency · propertiesonlinellc@outlook.com · 914-408-5708</div>
        <div style={{ fontSize: "11px", color: "#4A4D52", marginTop: "8px", fontStyle: "italic" }}>Dedicated to the residents of New York City.</div>
      </div>

      {/* CHATBOT */}
      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 500 }}>
        {chatOpen && (
          <div style={{ width: "340px", height: "480px", background: "#1e2024", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", borderTop: "3px solid #F7C600", display: "flex", flexDirection: "column", marginBottom: "12px", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>NYC Park Smart Assistant</div>
                <div style={{ fontSize: "10px", color: "#2ECC71", marginTop: "2px" }}>● Online · Powered by Groq</div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "#888", fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "80%", padding: "9px 12px", borderRadius: "4px", fontSize: "12px", lineHeight: 1.55, background: m.role === "user" ? "#F7C600" : "#2E3033", color: m.role === "user" ? "#1A1C1E" : "#fff", fontWeight: m.role === "user" ? 600 : 400 }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: "#2E3033", padding: "9px 12px", borderRadius: "4px", fontSize: "12px", color: "#888" }}>Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "8px" }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Ask about parking, MTA, traffic..."
                style={{ flex: 1, background: "#2E3033", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px", padding: "8px 10px", color: "#fff", fontSize: "12px", outline: "none" }}
              />
              <button onClick={sendChatMessage} style={{ background: "#F7C600", color: "#1A1C1E", fontWeight: 800, fontSize: "11px", padding: "8px 12px", border: "none", borderRadius: "2px", cursor: "pointer" }}>Send</button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(!chatOpen)} style={{ background: "#F7C600", color: "#1A1C1E", fontWeight: 800, fontSize: "12px", padding: "14px 20px", border: "none", borderRadius: "4px", cursor: "pointer", boxShadow: "0 4px 20px rgba(247,198,0,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {chatOpen ? "Close Chat" : "Ask Park Smart"}
        </button>
      </div>

      {/* EXIT MODAL */}
      {exitModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,11,12,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#242628", padding: "32px", maxWidth: "420px", width: "90%", borderRadius: "4px", borderTop: "3px solid #F7C600" }}>
            <div style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Leaving already?</div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "20px", lineHeight: 1.6 }}>Are you sure you know today's Alternate Side Parking schedule? Take one last look before you go.</div>
            <div style={{ background: "#2E3033", borderRadius: "2px", padding: "14px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ color: "#888" }}>Today</span>
                <span style={{ fontWeight: 600 }}>{asp?.suspendedToday ? `Suspended — ${asp.suspensionReason}` : "Check your posted sign"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0" }}>
                <span style={{ color: "#888" }}>Next suspension</span>
                <span style={{ color: "#F7C600", fontWeight: 600 }}>{asp?.nextSuspension ? `${asp.nextSuspension.date} — ${asp.nextSuspension.reason}` : "None scheduled"}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setExitModalOpen(false)} style={{ background: "#F7C600", color: "#1A1C1E", fontWeight: 700, padding: "10px 16px", borderRadius: "2px", border: "none", cursor: "pointer", fontSize: "12px" }}>Review Schedule</button>
              <button onClick={() => setExitModalOpen(false)} style={{ background: "transparent", color: "#888", fontWeight: 600, padding: "10px 16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontSize: "12px" }}>Exit Anyway</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
