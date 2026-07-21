// frontend/src/App.jsx
import { useState } from "react";
import StatusPanel from "./components/StatusPanel";
import StrategySelector from "./components/StrategySelector";
import MetricsChart from "./components/MetricsChart";

export default function App() {
  const [strategy, setStrategyState] = useState("round_robin");

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Load Balancer Control Panel</h1>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <StatusPanel />
        <StrategySelector current={strategy} onChanged={setStrategyState} />
      </div>
      <div style={{ marginTop: "1rem" }}>
        <MetricsChart />
      </div>
    </div>
  );
}