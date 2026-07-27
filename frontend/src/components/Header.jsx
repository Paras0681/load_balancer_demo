// frontend/src/components/Header.jsx
import { logout, getUsername } from "../services/authService";

// authed: boolean: whether a user is currently logged in
// onLoggedOut / onGoToLogin / onGoToRegister: navigation callbacks — wire
// these to whatever view-switching or routing you're using.
export default function Header({ authed, onLoggedOut, onGoToLogin, onGoToRegister }) {
  const username = authed ? getUsername() : null;

  const handleLogout = () => {
    logout();
    onLoggedOut?.();
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 1.5rem",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent-grad)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#fff",
          }}
        >
          ⇄
        </span>
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Load Balancer Control Panel
          </div>
          <div className="hint" style={{ margin: 0, fontSize: "0.7rem" }}>
            Switch algorithms, generate traffic, watch it distribute.
          </div>
        </div>
      </div>

      <div>
        {authed ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="hint" style={{ margin: 0 }}>
              Logged in as <span style={{ color: "var(--text)", fontWeight: 600 }}>{username}</span>
            </span>
            <button
              className="btn btn--ghost"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }}
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn--ghost"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }}
              onClick={onGoToLogin}
            >
              Log In
            </button>
            <button
              className="btn btn--primary"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }}
              onClick={onGoToRegister}
            >
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
}