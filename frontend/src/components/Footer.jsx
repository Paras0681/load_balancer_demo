// frontend/src/components/Footer.jsx
export default function Footer() {
  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 1.5rem",
        marginTop: "2rem",
        borderTop: "1px solid var(--border)",
        color: "var(--muted)",
        fontSize: "0.75rem",
        fontFamily: "var(--font-sans)",
      }}
    >
      <span>Load Balancer Demo — Django · nginx · Redis · Prometheus</span>
      <span style={{ fontFamily: "var(--font-mono)" }}>
        {new Date().getFullYear()} · github.com/Paras0681/load_balancer_demo
      </span>
    </footer>
  );
}