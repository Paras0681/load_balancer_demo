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
const COLORS = ["#7c6bff", "#2fd680", "#ffb84d", "#f0466e", "#4dd0e1"];

function shortenInstance(instance) {
  const match = instance.match(/(\d+)/);
  return match ? `B${match[1]}` : instance;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// One self-contained polling line-chart. Reused for each metric below.
function MetricPanel({ title, query, unit = "", height = 220 }) {
  const [data, setData] = useState([]);
  const seriesKeysRef = useRef(new Set());

  useEffect(() => {
    const poll = async () => {
      try {
        const result = await queryMetric(query);
        const points = result?.data?.result || [];
        const row = { time: new Date().toLocaleTimeString() };
        points.forEach((p) => {
          const rawInstance = p.metric.instance || p.metric.job || "unknown";
          const instance = shortenInstance(rawInstance);
          const value = parseFloat(p.value[1]);
          row[instance] = Number.isFinite(value) ? round2(value) : 0;
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
    <div className="card">
      <h3 className="card-title">{title}</h3>
      {data.length === 0 ? (
        <p className="empty-note">
          Waiting for data — make sure the stack is running and receiving traffic.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2438" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#8189a1" }} stroke="#262f45" />
            <YAxis tick={{ fontSize: 11, fill: "#8189a1" }} unit={unit} stroke="#262f45" />
            <Tooltip
              formatter={(value) => `${round2(value)}${unit}`}
              contentStyle={{
                background: "#161d2e",
                border: "1px solid #262f45",
                borderRadius: 8,
                fontSize: 12,
                color: "#e6e9f2",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#8189a1" }} />
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

export default function MetricsChart({ columns = 2, chartHeight = 220 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "0.5rem",
      }}
    >
      <MetricPanel
        title="Request Rate per Instance"
        query='sum(rate(django_http_requests_total_by_method_total[1m])) by (instance)'
        unit=" req/s"
        height={chartHeight}
      />

      <MetricPanel
        title="p95 Latency per Instance"
        query='histogram_quantile(0.95, sum(rate(django_http_requests_latency_seconds_by_view_method_bucket[1m])) by (le, instance))'
        unit="s"
        height={chartHeight}
      />
    </div>
  );
}