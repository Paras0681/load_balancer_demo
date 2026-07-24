// frontend/src/components/TrafficGeneratorButton.jsx
import { useRef, useState } from "react";
import { TrafficService } from "../services/trafficService";

const ALGO_PRESETS = [
  { label: "Round Robin", note: "nginx default — even split" },
  { label: "Least Conn", note: "nginx least_conn directive" },
  { label: "IP Hash", note: "nginx ip_hash — sticky by client" },
];

const emptyKindCounts = { list: 0, detail: 0, create: 0, provision: 0, unknown: 0 };

export default function TrafficGeneratorButton() {
  const [virtualUsers, setVirtualUsers] = useState(20);
  const [totalRequests, setTotalRequests] = useState(10000);
  const [thinkTimeMs, setThinkTimeMs] = useState(0);
  const [weights, setWeights] = useState({ create: 20, detail: 30, list: 50 });
  const [algoNote, setAlgoNote] = useState(ALGO_PRESETS[0]);

  const [running, setRunning] = useState(false);
  const [sent, setSent] = useState(0);
  const [ok, setOk] = useState(0);
  const [fail, setFail] = useState(0);
  const [byKind, setByKind] = useState(emptyKindCounts);
  const [firstFailure, setFirstFailure] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const serviceRef = useRef(new TrafficService());

  const setWeightField = (field, value) => setWeights((w) => ({ ...w, [field]: Number(value) }));

  const run = async () => {
    setRunning(true);
    setSent(0);
    setOk(0);
    setFail(0);
    setByKind(emptyKindCounts);
    setFirstFailure(null);

    const start = performance.now();

    await serviceRef.current.start(
      { virtualUsers, totalRequests, actionWeights: weights, thinkTimeMs },
      (event) => {
        setSent((s) => s + 1);
        setByKind((k) => ({ ...k, [event.kind]: (k[event.kind] ?? 0) + 1 }));
        if (event.ok) {
          setOk((v) => v + 1);
        } else {
          setFail((v) => v + 1);
          setFirstFailure((prev) => prev ?? `${event.kind} → ${event.status ?? "error"}: ${event.error ?? event.body ?? ""}`);
        }
      }
    );

    setElapsedMs(performance.now() - start);
    setRunning(false);
  };

  const stop = () => {
    serviceRef.current.stop();
  };

  return (
    <div
      style={{
        padding: "1.25rem",
        border: "1px solid #e2e2e2",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#374151" }}>
        Simulate Payment Traffic
      </h3>

      <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem" }}>
        <label style={{ flex: 1 }}>
          Virtual users (concurrency)
          <input
            type="number"
            value={virtualUsers}
            disabled={running}
            onChange={(e) => setVirtualUsers(Number(e.target.value))}
            style={{ width: "100%", marginTop: 4, padding: "0.3rem" }}
          />
        </label>
        <label style={{ flex: 1 }}>
          Total requests
          <input
            type="number"
            value={totalRequests}
            disabled={running}
            onChange={(e) => setTotalRequests(Number(e.target.value))}
            style={{ width: "100%", marginTop: 4, padding: "0.3rem" }}
          />
        </label>
        <label style={{ flex: 1 }}>
          Think time (ms)
          <input
            type="number"
            value={thinkTimeMs}
            disabled={running}
            onChange={(e) => setThinkTimeMs(Number(e.target.value))}
            style={{ width: "100%", marginTop: 4, padding: "0.3rem" }}
          />
        </label>
      </div>
      <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af" }}>
        Think time = 0 for a raw stress burst; set it to ~200–500ms to mimic real users
        pausing between actions instead of hammering nonstop.
      </p>

      <div style={{ fontSize: "0.8rem" }}>
        <div style={{ marginBottom: 4, color: "#6b7280" }}>
          Action mix % — create / detail / list (each virtual user only ever
          views its own payments, like a real customer would)
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="number"
            value={weights.create}
            disabled={running}
            onChange={(e) => setWeightField("create", e.target.value)}
            style={{ width: "100%", padding: "0.3rem" }}
          />
          <input
            type="number"
            value={weights.detail}
            disabled={running}
            onChange={(e) => setWeightField("detail", e.target.value)}
            style={{ width: "100%", padding: "0.3rem" }}
          />
          <input
            type="number"
            value={weights.list}
            disabled={running}
            onChange={(e) => setWeightField("list", e.target.value)}
            style={{ width: "100%", padding: "0.3rem" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.4rem" }}>
        {ALGO_PRESETS.map((a) => (
          <button
            key={a.label}
            onClick={() => setAlgoNote(a)}
            disabled={running}
            title="Reminder only — actually switch this in nginx.conf and reload"
            style={{
              flex: 1,
              padding: "0.35rem",
              fontSize: "0.75rem",
              borderRadius: 8,
              border: algoNote.label === a.label ? "1px solid #2563eb" : "1px solid #e2e2e2",
              background: algoNote.label === a.label ? "#eff6ff" : "#fff",
              color: algoNote.label === a.label ? "#2563eb" : "#374151",
              cursor: running ? "not-allowed" : "pointer",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af" }}>
        {algoNote.note} — label only; the actual switch happens in nginx.conf + reload.
      </p>

      <button
        onClick={running ? stop : run}
        style={{
          padding: "0.6rem",
          fontSize: "0.85rem",
          fontWeight: 600,
          borderRadius: 8,
          border: "none",
          background: running ? "#dc2626" : "#2563eb",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {running ? "Stop" : `Simulate ${totalRequests.toLocaleString()} requests`}
      </button>

      {(running || sent > 0) && (
        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: "#f3f4f6",
              overflow: "hidden",
              marginBottom: "0.4rem",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(sent / totalRequests) * 100}%`,
                background: "#2563eb",
                transition: "width 0.1s linear",
              }}
            />
          </div>
          <div>
            {sent.toLocaleString()}/{totalRequests.toLocaleString()} sent · {ok} ok · {fail} failed
          </div>
          <div>
            list {byKind.list} · create {byKind.create} · detail {byKind.detail}
            {byKind.provision > 0 && ` · ${byKind.provision} provisioning failures`}
          </div>
          {!running && elapsedMs > 0 && (
            <div>
              {(elapsedMs / 1000).toFixed(1)}s total ·{" "}
              {(sent / (elapsedMs / 1000)).toFixed(1)} req/s achieved
            </div>
          )}
          {firstFailure && (
            <div style={{ color: "#dc2626", marginTop: 4, whiteSpace: "pre-wrap" }}>
              First failure: {firstFailure}
            </div>
          )}
        </div>
      )}
    </div>
  );
}