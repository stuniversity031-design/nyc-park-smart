"use client";

import { useEffect, useState } from "react";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const inputStyle = {
  flex: 1,
  minWidth: 0,
  padding: "8px 10px",
  borderRadius: "2px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: "13px",
  outline: "none",
} as const;

const saveBtn = {
  background: "#F7C600",
  color: "#1A1C1E",
  fontWeight: 800,
  fontSize: "11px",
  padding: "8px 12px",
  border: "none",
  borderRadius: "2px",
  cursor: "pointer",
} as const;

export function NameEditor() {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setName(load<string>("ps_name", ""));
  }, []);

  const commit = () => {
    const clean = draft.trim().slice(0, 24);
    setName(clean);
    save("ps_name", clean);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ display: "flex", gap: "8px", marginTop: "6px", maxWidth: "300px" }}>
        <input
          autoFocus
          value={draft}
          maxLength={24}
          aria-label="Your name"
          placeholder="Your name"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          style={inputStyle}
        />
        <button onClick={commit} style={saveBtn}>Save</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-0.02em" }}>
        {name || "Welcome"}
      </div>
      <button
        onClick={() => {
          setDraft(name);
          setEditing(true);
        }}
        style={{ background: "none", border: "none", color: "#F7C600", fontSize: "11px", cursor: "pointer", padding: 0, marginTop: "2px" }}
      >
        {name ? "Change name" : "Add your name"}
      </button>
    </div>
  );
}

export function VehicleList() {
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setVehicles(load<string[]>("ps_vehicles", []));
  }, []);

  const add = () => {
    const clean = draft.trim().slice(0, 24);
    if (clean && vehicles.length < 4 && !vehicles.includes(clean)) {
      const next = [...vehicles, clean];
      setVehicles(next);
      save("ps_vehicles", next);
    }
    setDraft("");
    setAdding(false);
  };

  const remove = (v: string) => {
    const next = vehicles.filter((x) => x !== v);
    setVehicles(next);
    save("ps_vehicles", next);
  };

  const chip = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 10px",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "2px",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
  } as const;

  return (
    <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap", alignItems: "center" }}>
      {vehicles.map((v) => (
        <span key={v} style={chip}>
          {v}
          <button
            onClick={() => remove(v)}
            aria-label={"Remove " + v}
            style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", padding: 0, fontSize: "13px" }}
          >
            x
          </button>
        </span>
      ))}
      {adding ? (
        <div style={{ display: "flex", gap: "6px" }}>
          <input
            autoFocus
            value={draft}
            maxLength={24}
            aria-label="Vehicle nickname or plate"
            placeholder="Nickname or plate"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
              if (e.key === "Escape") setAdding(false);
            }}
            style={{ ...inputStyle, width: "150px", flex: "none" }}
          />
          <button onClick={add} style={saveBtn}>Add</button>
        </div>
      ) : (
        vehicles.length < 4 && (
          <button
            onClick={() => setAdding(true)}
            style={{ ...chip, background: "#F7C600", color: "#1A1C1E", border: "none", cursor: "pointer" }}
          >
            + Add vehicle
          </button>
        )
      )}
    </div>
  );
}
