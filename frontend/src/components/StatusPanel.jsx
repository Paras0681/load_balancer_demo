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
      <div style={{ padding: "1rem", border: "1px solid #e2e2e2", borderRadius: 12, color: "#9ca3af", fontSize: "0.9rem" }}>
        Loading status…
      </div>
    );
  }

  const allRunning = Object.values(status.containers).every((s) => s === "running");

  return (
    <div style={{ padding: "1.25rem", border: "1px solid #e2e2e2", borderRadius: 12, minWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#374151" }}>
          Load Balancer Stack
        </h3>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
            padding: "3px 8px",
            borderRadius: 999,
            background: allRunning ? "#dcfce7" : "#fee2e2",
            color: allRunning ? "#15803d" : "#b91c1c",
          }}
        >
          {allRunning ? "ALL SYSTEMS UP" : "PARTIAL"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
        {Object.entries(status.containers).map(([name, state]) => {
          const up = state === "running";
          return (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 8,
                background: "#f9fafb",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: up ? "#22c55e" : "#ef4444",
                    boxShadow: up ? "0 0 0 3px rgba(34,197,94,0.15)" : "0 0 0 3px rgba(239,68,68,0.15)",
                  }}
                />
                <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>
                  {formatName(name)}
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: up ? "#16a34a" : "#dc2626",
                }}
              >
                {up ? "UP" : "DOWN"}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "0.9rem" }}>
        <button
          onClick={handleStart}
          disabled={busy || allRunning}
          style={{
            flex: 1,
            padding: "9px 0",
            fontSize: "0.85rem",
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            cursor: busy || allRunning ? "default" : "pointer",
            background: busy || allRunning ? "#f3f4f6" : "#16a34a",
            color: busy || allRunning ? "#9ca3af" : "#ffffff",
            transition: "background 0.15s ease",
          }}
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={busy || !allRunning}
          style={{
            flex: 1,
            padding: "9px 0",
            fontSize: "0.85rem",
            fontWeight: 600,
            border: "none",
            borderRadius: 8,
            cursor: busy || !allRunning ? "default" : "pointer",
            background: busy || !allRunning ? "#f3f4f6" : "#dc2626",
            color: busy || !allRunning ? "#9ca3af" : "#ffffff",
            transition: "background 0.15s ease",
          }}
        >
          Stop
        </button>
      </div>

      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
        Strategy:{" "}
        <span style={{ fontWeight: 600, color: "#374151" }}>
          {status.strategy.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      </div>
    </div>
  );
}