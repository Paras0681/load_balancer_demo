// frontend/src/components/StrategySelector.jsx
import { useState } from "react";
import { setStrategy } from "../api";
import StatusPanel from "./StatusPanel";

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
    <div className="card">
      <h3 className="card-title">Load Balancing Algo. & Running Status</h3>

      <div className="segmented">
        {STRATEGIES.map(({ value, label }) => {
          const active = value === current;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={busy}
              className={`segmented-btn ${active ? "is-active" : ""}`}
              style={{ opacity: busy && !active ? 0.5 : 1 }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {busy && <div className="hint">Switching…</div>}

      <StatusPanel />
    </div>
  );
}