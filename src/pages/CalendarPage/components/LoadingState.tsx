interface LoadingStateProps {
  text: string;
}

export function LoadingState({ text }: LoadingStateProps) {
  return (
    <div style={{ padding: "16px", minHeight: "100vh", backgroundColor: "var(--hp-surface-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid var(--hp-border)", borderTopColor: "var(--hp-primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px auto" }} />
        <div style={{ fontSize: "16px", fontWeight: "500", color: "var(--hp-muted)" }}>{text}</div>
      </div>
    </div>
  );
}
