// frontend/src/components/StatusPanel.jsx
import { useEffect, useState } from "react";
import { getStatus, startStack, stopStack } from "../src/api";

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

  if (!status) return <div>Loading status...</div>;

  const allRunning = Object.values(status.containers).every(
    (s) => s === "running"
  );

  return (
    <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: 8 }}>
      <h3>Load Balancer Stack</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {Object.entries(status.containers).map(([name, state]) => (
          <li key={name}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                marginRight: 8,
                background: state === "running" ? "#22c55e" : "#ef4444",
              }}
            />
            {name}: {state}
          </li>
        ))}
      </ul>
      <button onClick={handleStart} disabled={busy || allRunning}>
        Start
      </button>{" "}
      <button onClick={handleStop} disabled={busy || !allRunning}>
        Stop
      </button>
      <p>Current strategy: <strong>{status.strategy}</strong></p>
    </div>
  );
}