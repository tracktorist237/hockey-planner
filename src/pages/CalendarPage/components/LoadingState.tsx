interface LoadingStateProps {
  text: string;
}

export function LoadingState({ text }: LoadingStateProps) {
  return (
    <div style={{ padding: "16px", minHeight: "100vh", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e0e0e0", borderTopColor: "#1976d2", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px auto" }} />
        <div style={{ fontSize: "16px", fontWeight: "500", color: "#666" }}>{text}</div>
      </div>
    </div>
  );
}
