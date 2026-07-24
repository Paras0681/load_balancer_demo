// frontend/src/services/trafficService.js
//
// Simulates day-to-day payment traffic: each "virtual user" is one customer
// who registers, logs in, and then loops through list / detail / create
// actions with its own token and its own set of payments — the same way a
// real customer session would only ever touch its own data.
//
// ── ASSUMPTIONS — fix to match your urls.py / serializers ──
const BASE = import.meta.env.VITE_LB_URL || "http://localhost:8080";
const REGISTER_URL = `${BASE}/api/register/`;
const TOKEN_URL = `${BASE}/api/token/`;
const PAYMENTS_URL = `${BASE}/api/payments/`;
const CUSTOMER_ID_FIELD = "customer_id"; // field name in registration response
const PAYMENT_METHODS = ["card", "upi", "bank_transfer"];
// ─────────────────────────────────────────────────────────

function randomSuffix() {
  return Math.random().toString(36).slice(2, 9);
}

function randomAmount() {
  return (Math.random() * 1000 + 1).toFixed(2);
}

function randomMethod() {
  return PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
}

// Provision one throwaway customer: register, then log in, return {token, customerId}
async function provisionCustomer() {
  const suffix = randomSuffix();
  const username = `loadtest_${suffix}`;
  const password = "LoadTest!12345";

  const regRes = await fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      first_name: "Load",
      last_name: "Test",
      email: `${username}@example.com`,
      age: 30,
    }),
  });
  if (!regRes.ok) {
    throw new Error(`register failed: ${regRes.status} ${await regRes.text()}`);
  }
  const regData = await regRes.json();
  const customerId = regData[CUSTOMER_ID_FIELD];
  if (!customerId) {
    throw new Error(
      `registration response missing "${CUSTOMER_ID_FIELD}" — add it to CustomerRegistrationSerializer.Meta.fields`
    );
  }

  const loginRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!loginRes.ok) {
    throw new Error(`login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const { access } = await loginRes.json();
  return { token: access, customerId };
}

async function listPayments(token) {
  return fetch(PAYMENTS_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function getPaymentDetail(token, paymentId) {
  return fetch(`${PAYMENTS_URL}${paymentId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function createPayment(token, customerId) {
  return fetch(PAYMENTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: randomAmount(),
      customer_id: customerId,
      payment_method: randomMethod(),
    }),
  });
}

// One simulated customer's session: provision once, then repeatedly act
// until the shared budget is exhausted or cancelled. actionWeights sums
// to 100 and controls how "day-to-day" vs "create-heavy" the mix feels.
async function runVirtualUser({ budget, cancelRef, actionWeights, thinkTimeMs, onEvent }) {
  let session;
  try {
    session = await provisionCustomer();
  } catch (err) {
    onEvent({ kind: "provision", ok: false, error: err.message });
    return;
  }

  const ownPaymentIds = [];

  while (!cancelRef.current && budget.remaining() > 0) {
    budget.take();
    const r = Math.random() * 100;
    let kind;
    let res;
    try {
      if (r < actionWeights.create) {
        kind = "create";
        res = await createPayment(session.token, session.customerId);
      } else if (r < actionWeights.create + actionWeights.detail && ownPaymentIds.length > 0) {
        kind = "detail";
        const id = ownPaymentIds[Math.floor(Math.random() * ownPaymentIds.length)];
        res = await getPaymentDetail(session.token, id);
      } else {
        kind = "list";
        res = await listPayments(session.token);
      }

      if (res.ok) {
        if (kind === "create") {
          const data = await res.clone().json();
          if (data?.payment_id) ownPaymentIds.push(data.payment_id);
        }
        onEvent({ kind, ok: true });
      } else {
        onEvent({ kind, ok: false, status: res.status, body: (await res.text()).slice(0, 300) });
      }
    } catch (err) {
      onEvent({ kind: kind || "unknown", ok: false, error: err.message });
    }

    if (thinkTimeMs > 0) {
      await new Promise((r2) => setTimeout(r2, thinkTimeMs * (0.5 + Math.random())));
    }
  }
}

// Shared counter so N virtual users can pull from one total-requests budget
// without needing to coordinate directly.
function makeBudget(total) {
  let used = 0;
  return {
    take: () => (used += 1),
    remaining: () => total - used,
  };
}

export class TrafficService {
  constructor() {
    this.cancelRef = { current: false };
  }

  // config: { virtualUsers, totalRequests, actionWeights: {create, detail, list}, thinkTimeMs }
  // onEvent(event) fires per completed request: { kind, ok, status?, error? }
  async start(config, onEvent) {
    this.cancelRef.current = false;
    const budget = makeBudget(config.totalRequests);
    const users = Array.from({ length: config.virtualUsers }, () =>
      runVirtualUser({
        budget,
        cancelRef: this.cancelRef,
        actionWeights: config.actionWeights,
        thinkTimeMs: config.thinkTimeMs ?? 0,
        onEvent,
      })
    );
    await Promise.all(users);
  }

  stop() {
    this.cancelRef.current = true;
  }
}