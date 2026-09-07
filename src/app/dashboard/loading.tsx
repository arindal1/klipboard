export default function DashboardLoading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <div className="neu-panel" style={{ padding: "24px 32px", fontSize: 14, color: "var(--muted)" }}>
        Loading your notepads…
      </div>
    </main>
  );
}