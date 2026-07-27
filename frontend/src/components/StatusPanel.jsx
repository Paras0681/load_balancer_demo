// frontend/src/components/StatusPanel.jsx
import { useEffect, useState } from "react";
import { getStatus, startStack, stopStack } from "../api";

function formatName(name) {
  const match = name.match(/^backend(\d+)$/);
  if (match) return `Backend ${match[1]}`;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function StatusPanel() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const data = await getStatus();
      setStatus(data);
    } catch (e) {
      console.error("status fetch failed", e);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, []);

  const handleStart = async () => {
    setBusy(true);
    await startStack();
    await refresh();
    setBusy(false);
  };

  const handleStop = async () => {
    setBusy(true);
    await stopStack();
    await refresh();
    setBusy(false);
  };

  if (!status) {
    return (
      <div className="card">
        <p className="empty-note">Loading status…</p>
      </div>
    );
  }

  const allRunning = Object.values(status.containers).every((s) => s === "running");

  return (
    <div className="card" style={{ minWidth: 280 }}>
      <div className="card-header">
        <h3 className="card-title">Load Balancer Stack</h3>
        <span className={`badge ${allRunning ? "badge--ok" : "badge--warn"}`}>
          {allRunning ? "ALL SYSTEMS UP" : "PARTIAL"}
        </span>
      </div>

      <div className="hint" style={{ margin: 0 }}>
        Strategy:{" "}
        <span style={{ fontWeight: 600, color: "var(--text)" }}>
          {status.strategy.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Object.entries(status.containers).map(([name, state]) => {
          const up = state === "running";
          return (
            <div key={name} className="row-item">
              <div className="row-item-label">
                <span className={`status-dot ${up ? "status-dot--ok" : "status-dot--danger"}`} />
                {formatName(name)}
              </div>
              <span className={`row-item-state ${up ? "row-item-state--ok" : "row-item-state--danger"}`}>
                {up ? "UP" : "DOWN"}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn--ok"
          style={{ flex: 1 }}
          onClick={handleStart}
          disabled={busy || allRunning}
        >
          Start
        </button>
        <button
          className="btn btn--stop"
          style={{ flex: 1 }}
          onClick={handleStop}
          disabled={busy || !allRunning}
        >
          Stop
        </button>
      </div>
    </div>
  );
}