// frontend/src/App.jsx
import { useState } from "react";
import StrategySelector from "./components/StrategySelector";
import MetricsChart from "./components/MetricsChart";
import TrafficGeneratorButton from "./components/TrafficGeneratorButton";

export default function App() {
  const [strategy, setStrategyState] = useState("round_robin");

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Load Balancer Control Panel</h1>
      <div style={{ marginTop: "1rem" , marginBottom: "1rem"}}>
        <TrafficGeneratorButton />
        <MetricsChart />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        }}
      >
        <StrategySelector current={strategy} onChanged={setStrategyState} />
      </div>
    </div>
  );
}