interface ErrorStateProps {
  error: string;
  onBack: () => void;
}

export function ErrorState({ error, onBack }: ErrorStateProps) {
  return (
    <div style={{ padding: "16px", minHeight: "100vh", backgroundColor: "var(--hp-surface-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>⚠️</div>
        <h3 style={{ margin: "0 0 8px 0", color: "#c62828" }}>Ошибка</h3>
        <p style={{ margin: "0 0 24px 0", color: "var(--hp-muted)" }}>{error}</p>
        <button onClick={onBack} style={{ padding: "12px 24px", backgroundColor: "var(--hp-primary)", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", cursor: "pointer" }}>Назад к списку</button>
      </div>
    </div>
  );
}
