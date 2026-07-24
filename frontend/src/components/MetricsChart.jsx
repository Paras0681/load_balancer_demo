// frontend/src/components/MetricsChart.jsx
import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { queryMetric } from "../api";

const POLL_MS = 5000;
const MAX_POINTS = 20;
const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

// One self-contained polling line-chart. Reused for each metric below.
function MetricPanel({ title, query, unit = "" }) {
  const [data, setData] = useState([]);
  const seriesKeysRef = useRef(new Set());

  useEffect(() => {
    const poll = async () => {
      try {
        const result = await queryMetric(query);
        const points = result?.data?.result || [];
        const row = { time: new Date().toLocaleTimeString() };
        const shortenInstance = (instance) => {
          const match = instance.match(/(\d+)/);
          return match ? `B${match[1]}` : instance;
        };
        points.forEach((p) => {
          const rawInstance = p.metric.instance || p.metric.job || "unknown";
          const instance = shortenInstance(rawInstance);
          const value = parseFloat(p.value[1]);
          row[instance] = Number.isFinite(value) ? value : 0;
          seriesKeysRef.current.add(instance);
        });
        setData((prev) => [...prev.slice(-(MAX_POINTS - 1)), row]);
      } catch (e) {
        console.error(`metrics poll failed (${title})`, e);
      }
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [query, title]);

  return (
    <div style={{ padding: "1.25rem", border: "1px solid #e2e2e2", borderRadius: 12 }}>
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 600, color: "#374151" }}>
        {title}
      </h3>
      {data.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
          Waiting for data — make sure the stack is running and receiving traffic.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit={unit} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {[...seriesKeysRef.current].map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function MetricsChart() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
      }}
    >
      <MetricPanel
        title="Request Rate per Instance"
        query='sum(rate(django_http_requests_total_by_method_total[1m])) by (instance)'
        unit=" req/s"
      />

      <MetricPanel
        title="p95 Latency per Instance"
        query='histogram_quantile(0.95, sum(rate(django_http_requests_latency_seconds_by_view_method_bucket[1m])) by (le, instance))'
        unit="s"
      />
    </div>
  );
}