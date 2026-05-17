interface ErrorMessageProps {
  error: string;
}

export const ErrorMessage = ({ error }: ErrorMessageProps) => {
  return (
    <div
      style={{
        backgroundColor: "var(--hp-danger-soft)",
        color: "var(--hp-danger)",
        padding: "14px",
        borderRadius: "10px",
        marginBottom: "20px",
        fontSize: "15px",
        borderLeft: "4px solid var(--hp-danger)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      ⚠️ {error}
    </div>
  );
};
