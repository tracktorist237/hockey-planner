interface ErrorMessageProps {
  error: string;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div style={{ backgroundColor: "#ffebee", color: "#c62828", padding: "16px", borderRadius: "12px", marginBottom: "20px", fontSize: "15px", borderLeft: "4px solid #c62828", display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "20px" }}>⚠️</span>
      <span>{error}</span>
    </div>
  );
}
