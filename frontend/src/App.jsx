// frontend/src/App.jsx
import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import StrategySelector from "./components/StrategySelector";
import MetricsChart from "./components/MetricsChart";
import TrafficGeneratorButton from "./components/TrafficGeneratorButton";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { isAuthenticated } from "./services/authService";

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [authView, setAuthView] = useState("login"); // "login" | "register"
  const [strategy, setStrategyState] = useState("round_robin");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <Header
        authed={authed}
        onLoggedOut={() => setAuthed(false)}
        onGoToLogin={() => setAuthView("login")}
        onGoToRegister={() => setAuthView("register")}
      />

      <div style={{ flex: 1 }}>
        {!authed ? (
          authView === "login" ? (
            <LoginPage
              onSuccess={() => setAuthed(true)}
              onGoToRegister={() => setAuthView("register")}
            />
          ) : (
            <RegisterPage
              onSuccess={() => setAuthView("login")}
              onGoToLogin={() => setAuthView("login")}
            />
          )
        ) : (
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
            <MetricsChart chartHeight={170} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                alignItems: "stretch",
                marginTop: "1rem",
              }}
            >
              <TrafficGeneratorButton />
              <StrategySelector current={strategy} onChanged={setStrategyState} />
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}