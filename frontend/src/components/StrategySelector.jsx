// frontend/src/components/StrategySelector.jsx
import { useState } from "react";
import { setStrategy } from "../api";

const STRATEGIES = ["round_robin", "weighted_round_robin", "least_conn", "ip_hash"];

export default function StrategySelector({ current, onChanged }) {
  const [busy, setBusy] = useState(false);

  const handleChange = async (e) => {
    const strategy = e.target.value;
    setBusy(true);
    const result = await setStrategy(strategy);
    setBusy(false);
    if (result.ok && onChanged) onChanged(strategy);
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: 8 }}>
      <h3>Load Balancing Strategy</h3>
      <select value={current} onChange={handleChange} disabled={busy}>
        {STRATEGIES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {busy && <span style={{ marginLeft: 8 }}>Switching...</span>}
    </div>
  );
}