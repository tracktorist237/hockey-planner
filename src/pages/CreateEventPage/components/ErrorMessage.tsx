interface ErrorMessageProps {
  error: string;
}

export const ErrorMessage = ({ error }: ErrorMessageProps) => {
  return (
    <div
      style={{
        backgroundColor: "#ffebee",
        color: "#c62828",
        padding: "14px",
        borderRadius: "10px",
        marginBottom: "20px",
        fontSize: "15px",
        borderLeft: "4px solid #c62828",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      ⚠️ {error}
    </div>
  );
};
