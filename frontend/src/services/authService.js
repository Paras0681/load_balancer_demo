// frontend/src/services/authService.js
//
// Wraps the register/login/logout flow and token storage. Reuses the same
// BASE url convention as trafficService.js.

const BASE = import.meta.env.VITE_LB_URL || "http://localhost:8080";
const REGISTER_URL = `${BASE}/api/register/`;
const TOKEN_URL = `${BASE}/api/token/`;

const ACCESS_KEY = "lb_demo_access_token";
const REFRESH_KEY = "lb_demo_refresh_token";
const USERNAME_KEY = "lb_demo_username";

async function parseErrorBody(res) {
  try {
    const data = await res.json();
    // DRF error shapes vary — flatten whatever comes back into one string.
    if (typeof data === "string") return data;
    return Object.entries(data)
      .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
      .join(" | ");
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

export async function register({ username, password, firstName, lastName, email, age }) {
  const res = await fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      first_name: firstName,
      last_name: lastName,
      email,
      age: Number(age),
    }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorBody(res));
  }
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error(await parseErrorBody(res));
  }
  const data = await res.json();
  localStorage.setItem(ACCESS_KEY, data.access);
  if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
  localStorage.setItem(USERNAME_KEY, username);
  return data;
}

// Stateless JWT logout: clears local tokens. If you add
// rest_framework_simplejwt.token_blacklist later, POST the refresh
// token to your blacklist endpoint here before clearing storage.
export function logout() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY);
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}