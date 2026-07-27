// frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { login } from "../services/authService";

// onSuccess(username) fires after a successful login — wire this to your
// navigation (redirect to dashboard, switch view state, etc.)
export default function LoginPage({ onSuccess, onGoToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      onSuccess?.(username);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2rem 1rem" }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 340, gap: "1rem" }}>
        <div className="card-header">
          <h3 className="card-title">Log In</h3>
        </div>

        <label className="field">
          Username
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={busy}
            autoFocus
            required
          />
        </label>

        <label className="field">
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            required
          />
        </label>

        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log In"}
        </button>

        {error && <div className="callout-danger">{error}</div>}

        <p className="hint" style={{ textAlign: "center", margin: 0 }}>
          Need an account?{" "}
          <button
            type="button"
            onClick={onGoToRegister}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              padding: 0,
              font: "inherit",
            }}
          >
            Register
          </button>
        </p>
      </form>
    </div>
  );
}