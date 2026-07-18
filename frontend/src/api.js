// frontend/src/api.js
const CONTROLLER_URL = "http://localhost:5001";

export async function getStatus() {
  const res = await fetch(`${CONTROLLER_URL}/status`);
  return res.json();
}

export async function startStack() {
  const res = await fetch(`${CONTROLLER_URL}/start`, { method: "POST" });
  return res.json();
}

export async function stopStack() {
  const res = await fetch(`${CONTROLLER_URL}/stop`, { method: "POST" });
  return res.json();
}

export async function setStrategy(strategy) {
  const res = await fetch(`${CONTROLLER_URL}/strategy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ strategy }),
  });
  return res.json();
}

export async function queryMetric(promql) {
  const res = await fetch(
    `${CONTROLLER_URL}/metrics/query?q=${encodeURIComponent(promql)}`
  );
  return res.json();
}