"use client";

import { useEffect, useState } from "react";

interface MtaAlert {
  header: string;
  routes: string;
  description?: string;
}
interface Complaint {
  type: string;
  description?: string;
  address: string;
  status: string;
  date: string;
}
interface Props {
  mtaAlerts: MtaAlert[];
  complaints: Complaint[];
  zip: string;
  updatedAt: Date | null;
}

export default function MoreInfo({ mtaAlerts, complaints, zip, updatedAt }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const stamp = updatedAt ? updatedAt.toLocaleTimeString() : "loading";
  const sectionLabel = {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#F7C600",
  };
  const sourceLine = { fontSize: "10px", color: "#888", margin: "4px 0 12px" };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        style={{
          background: "#F7C600",
          color: "#1A1C1E",
          fontWeight: 800,
          fontSize: "11px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "8px 14px",
          border: "none",
          borderRadius: "2px",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        More Info
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(10,11,12,0.7)", zIndex: 800 }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More information"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(420px, 100vw)",
              background: "#1e2024",
              borderLeft: "3px solid #F7C600",
              overflowY: "auto",
              zIndex: 900,
              padding: "20px",
              color: "#fff",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "16px", fontWeight: 800 }}>More Info</div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={sectionLabel}>Transit</div>
            <div style={sourceLine}>Source: MTA real-time alerts · Updated {stamp}</div>
            {mtaAlerts.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#888", marginBottom: "24px" }}>No active alerts.</div>
            ) : (
              <div style={{ marginBottom: "24px" }}>
                {mtaAlerts.map((a, i) => (
                  <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "10px", color: "#1A7FD4", fontWeight: 700 }}>Lines: {a.routes}</div>
                    <div style={{ fontSize: "12px", lineHeight: 1.5, marginTop: "3px" }}>{a.header}</div>
                    {a.description && (
                      <div style={{ fontSize: "11px", color: "#999", marginTop: "3px", lineHeight: 1.45 }}>{a.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={sectionLabel}>311 Reports</div>
            <div style={sourceLine}>Source: NYC 311 via NYC Open Data · ZIP {zip} · Updated {stamp}</div>
            {complaints.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#888" }}>No recent reports in this ZIP.</div>
            ) : (
              complaints.map((c, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "10px", color: "#E85D04", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {c.type}{c.description ? ` · ${c.description}` : ""}
                  </div>
                  <div style={{ fontSize: "12px", marginTop: "3px" }}>{c.address}</div>
                  <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>
                    {c.status} · {new Date(c.date).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
