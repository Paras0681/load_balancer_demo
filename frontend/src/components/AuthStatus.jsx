// frontend/src/components/AuthStatus.jsx
import { getUsername, logout } from "../services/authService";

// onLoggedOut() fires after logout — wire this to your navigation
// (redirect to login page, clear dashboard state, etc.)
export default function AuthStatus({ onLoggedOut }) {
  const username = getUsername();

  const handleLogout = () => {
    logout();
    onLoggedOut?.();
  };

  if (!username) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span className="hint" style={{ margin: 0 }}>
        Logged in as <span style={{ color: "var(--text)", fontWeight: 600 }}>{username}</span>
      </span>
      <button className="btn btn--ghost" style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }} onClick={handleLogout}>
        Log Out
      </button>
    </div>
  );
}