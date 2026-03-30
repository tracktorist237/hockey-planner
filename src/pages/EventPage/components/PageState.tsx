interface ActionStateProps {
  onBack: () => void;
}

interface ErrorStateProps extends ActionStateProps {
  error: string;
}

export const LoadingState = () => {
  return (
    <div
      style={{
        padding: "16px",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #e0e0e0",
            borderTopColor: "#1976d2",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px auto",
          }}
        />
        <div style={{ fontSize: "16px", fontWeight: "500", color: "#666" }}>Загрузка мероприятия...</div>
      </div>
    </div>
  );
};

export const ErrorState = ({ error, onBack }: ErrorStateProps) => {
  return (
    <div
      style={{
        padding: "16px",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>⚠️</div>
        <h3 style={{ margin: "0 0 8px 0", color: "#c62828" }}>Ошибка</h3>
        <p style={{ margin: "0 0 24px 0", color: "#666" }}>{error}</p>
        <button
          onClick={onBack}
          style={{
            padding: "12px 24px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Назад к списку
        </button>
      </div>
    </div>
  );
};

export const NotFoundState = ({ onBack }: ActionStateProps) => {
  return (
    <div
      style={{
        padding: "16px",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>🗓️</div>
        <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>Событие не найдено</h3>
        <button
          onClick={onBack}
          style={{
            padding: "12px 24px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Назад к списку
        </button>
      </div>
    </div>
  );
};
