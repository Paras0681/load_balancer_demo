// frontend/src/components/StrategySelector.jsx
import { useState } from "react";
import { setStrategy } from "../api";
import StatusPanel from "./StatusPanel"

const STRATEGIES = [
  { value: "round_robin", label: "Round Robin" },
  { value: "weighted_round_robin", label: "Weighted" },
  { value: "least_conn", label: "Least Conn." },
  { value: "ip_hash", label: "IP Hash" },
];

export default function StrategySelector({ current, onChanged }) {
  const [busy, setBusy] = useState(false);

  const handleSelect = async (strategy) => {
    if (strategy === current || busy) return;
    setBusy(true);
    const result = await setStrategy(strategy);
    setBusy(false);
    if (result.ok && onChanged) onChanged(strategy);
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #e2e2e2", borderRadius: 12 }}>
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 600, color: "#374151" }}>
        Load Balancing Strategy & Status
      </h3>
      <div
        style={{
          marginBottom: "1rem",
          display: "inline-flex",
          padding: 4,
          background: "#f3f4f6",
          borderRadius: 10,
          gap: 4,
        }}
      >
        {STRATEGIES.map(({ value, label }) => {
          const active = value === current;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={busy}
              style={{
                padding: "8px 14px",
                fontSize: "0.85rem",
                fontWeight: 500,
                border: "none",
                borderRadius: 8,
                cursor: busy ? "default" : "pointer",
                background: active ? "#111827" : "transparent",
                color: active ? "#ffffff" : "#4b5563",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                transition: "background 0.15s ease, color 0.15s ease",
                opacity: busy && !active ? 0.5 : 1,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {busy && (
        <div style={{ marginTop: 8, fontSize: "0.8rem", color: "#9ca3af" }}>
          Switching…
        </div>
      )}
      <StatusPanel />
    </div>
  );
}