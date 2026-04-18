interface FormHeaderProps {
  onBack: () => void;
  isVisible: boolean;
  title?: string;
}

export const FormHeader = ({
  onBack,
  isVisible,
  title = "Новое событие",
}: FormHeaderProps) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        zIndex: "100",
        backgroundColor: "white",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: isVisible ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
        padding: "16px",
        height: "76px",
        boxSizing: "border-box",
        transform: isVisible ? "translateY(0)" : "translateY(-100%)",
        opacity: isVisible ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          maxWidth: "100%",
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #e0e0e0",
            background: "white",
            fontSize: "20px",
            cursor: "pointer",
            borderRadius: "10px",
            marginRight: "12px",
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
            e.currentTarget.style.borderColor = "#1976d2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.borderColor = "#e0e0e0";
          }}
        >
          ⬅
        </button>
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#1a237e", flex: 1 }}>
          {title}
        </h1>
      </div>
    </div>
  );
};
