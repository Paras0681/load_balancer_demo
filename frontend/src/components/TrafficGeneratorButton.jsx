// frontend/src/components/TrafficGeneratorButton.jsx
import { useRef, useState } from "react";
import { TrafficService } from "../services/trafficService";

const emptyKindCounts = { list: 0, detail: 0, create: 0, provision: 0, unknown: 0 };

export default function TrafficGeneratorButton() {
  const [virtualUsers, setVirtualUsers] = useState(20);
  const [totalRequests, setTotalRequests] = useState(10000);
  const [thinkTimeMs, setThinkTimeMs] = useState(0);
  const [weights, setWeights] = useState({ create: 20, detail: 30, list: 50 });

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
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Traffic Simulator</h3>
        <span className={`pulse-dot ${running ? "is-live" : ""}`} />
      </div>

      <div className="fields-grid">
        <label className="field">
          Virtual users
          <input
            className="input"
            type="number"
            value={virtualUsers}
            disabled={running}
            onChange={(e) => setVirtualUsers(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Total requests
          <input
            className="input"
            type="number"
            value={totalRequests}
            disabled={running}
            onChange={(e) => setTotalRequests(Number(e.target.value))}
          />
        </label>
        <label className="field">
          Think time (ms)
          <input
            className="input"
            type="number"
            value={thinkTimeMs}
            disabled={running}
            onChange={(e) => setThinkTimeMs(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="hint">
        Think time = 0 for a raw stress burst; set ~200–500ms to mimic real users effect.
      </p>

      <div>
        <div className="hint" style={{ textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.72rem" }}>Action mix % — create / detail / list</div>
        <div className="mix-row">
          <div className="mix-item">
            <input
              className="input"
              type="number"
              value={weights.create}
              disabled={running}
              onChange={(e) => setWeightField("create", e.target.value)}
            />
            <span className="hint" style={{ fontFamily: "var(--font-mono)" }}>create</span>
          </div>
          <div className="mix-item">
            <input
              className="input"
              type="number"
              value={weights.detail}
              disabled={running}
              onChange={(e) => setWeightField("detail", e.target.value)}
            />
            <span className="hint" style={{ fontFamily: "var(--font-mono)" }}>detail</span>
          </div>
          <div className="mix-item">
            <input
              className="input"
              type="number"
              value={weights.list}
              disabled={running}
              onChange={(e) => setWeightField("list", e.target.value)}
            />
            <span className="hint" style={{ fontFamily: "var(--font-mono)" }}>list</span>
          </div>
        </div>
      </div>

      <button
        className={`btn ${running ? "btn--stop" : "btn--primary"}`}
        onClick={running ? stop : run}
      >
        {running ? "Stop" : `Simulate ${totalRequests.toLocaleString()} requests`}
      </button>

      {(running || sent > 0) && (
        <div className="stats">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(sent / totalRequests) * 100}%` }}
            />
          </div>
          <div className="stats-row">
            <span>{sent.toLocaleString()}/{totalRequests.toLocaleString()} sent</span>
            <span className="stat-ok">{ok} ok</span>
            <span className="stat-fail">{fail} failed</span>
          </div>
          <div className="stats-row">
            <span>list {byKind.list}</span>
            <span>create {byKind.create}</span>
            <span>detail {byKind.detail}</span>
            {byKind.provision > 0 && <span className="stat-fail">{byKind.provision} provisioning failures</span>}
          </div>
          {!running && elapsedMs > 0 && (
            <div className="stats-row">
              <span>{(elapsedMs / 1000).toFixed(1)}s total</span>
              <span>{(sent / (elapsedMs / 1000)).toFixed(1)} req/s achieved</span>
            </div>
          )}
          {firstFailure && <div className="callout-danger">First failure: {firstFailure}</div>}
        </div>
      )}
    </div>
  );
}