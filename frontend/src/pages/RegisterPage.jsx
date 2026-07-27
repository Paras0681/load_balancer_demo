// frontend/src/pages/RegisterPage.jsx
import { useState } from "react";
import { register } from "../services/authService";

// onSuccess(username) fires after a successful registration — wire this to
// your navigation (redirect to login, switch view state, etc.)
export default function RegisterPage({ onSuccess, onGoToLogin }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    age: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(form);
      setDone(true);
      onSuccess?.(form.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2rem 1rem" }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 380, gap: "1rem" }}>
        <div className="card-header">
          <h3 className="card-title">Create Account</h3>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <label className="field" style={{ flex: 1 }}>
            First name
            <input
              className="input"
              value={form.firstName}
              onChange={setField("firstName")}
              disabled={busy}
              required
            />
          </label>
          <label className="field" style={{ flex: 1 }}>
            Last name
            <input
              className="input"
              value={form.lastName}
              onChange={setField("lastName")}
              disabled={busy}
              required
            />
          </label>
        </div>

        <label className="field">
          Username
          <input
            className="input"
            value={form.username}
            onChange={setField("username")}
            disabled={busy}
            required
          />
        </label>

        <label className="field">
          Email
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={setField("email")}
            disabled={busy}
            required
          />
        </label>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <label className="field" style={{ flex: 1 }}>
            Age
            <input
              className="input"
              type="number"
              value={form.age}
              onChange={setField("age")}
              disabled={busy}
              required
            />
          </label>
          <label className="field" style={{ flex: 2 }}>
            Password
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={setField("password")}
              disabled={busy}
              minLength={8}
              required
            />
          </label>
        </div>

        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Register"}
        </button>

        {error && <div className="callout-danger">{error}</div>}
        {done && !error && (
          <div className="hint" style={{ color: "var(--ok)" }}>
            Account created. You can log in now.
          </div>
        )}

        <p className="hint" style={{ textAlign: "center", margin: 0 }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onGoToLogin}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              padding: 0,
              font: "inherit",
            }}
          >
            Log in
          </button>
        </p>
      </form>
    </div>
  );
}