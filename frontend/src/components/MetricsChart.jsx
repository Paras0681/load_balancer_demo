// frontend/src/components/MetricsChart.jsx
import { useEffect, useRef, useState } from "react";import {
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

const METRIC_QUERY =
  'sum(rate(django_http_requests_total_by_method_total[1m])) by (instance)';

const POLL_MS = 5000;
const MAX_POINTS = 20;

export default function MetricsChart() {
  const [data, setData] = useState([]);
  const seriesKeysRef = useRef(new Set());

  useEffect(() => {
    const poll = async () => {
      try {
        const result = await queryMetric(METRIC_QUERY);
        const points = result?.data?.result || [];
        const row = { time: new Date().toLocaleTimeString() };
        points.forEach((p) => {
          const instance = p.metric.instance || "unknown";
          const value = parseFloat(p.value[1]);
          row[instance] = value;
          seriesKeysRef.current.add(instance);
        });
        setData((prev) => [...prev.slice(-(MAX_POINTS - 1)), row]);
      } catch (e) {
        console.error("metrics poll failed", e);
      }
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const colors = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

  return (
    <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: 8 }}>
      <h3>Request Rate per Instance</h3>
      {data.length === 0 ? (
        <p>Waiting for data — make sure the stack is running and receiving traffic.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            {[...seriesKeysRef.current].map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}