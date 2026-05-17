interface PasswordModalProps {
  isOpen: boolean;
  passwordInput: string;
  passwordError: string;
  onChangePassword: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const PasswordModal = ({
  isOpen,
  passwordInput,
  passwordError,
  onChangePassword,
  onClose,
  onSubmit,
}: PasswordModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--hp-surface)",
          borderRadius: "20px",
          maxWidth: "400px",
          width: "100%",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "20px",
            fontWeight: "600",
            color: "var(--hp-heading)",
          }}
        >
          Введите пароль
        </h3>

        <p
          style={{
            margin: "0 0 16px 0",
            fontSize: "14px",
            color: "var(--hp-muted)",
            lineHeight: "1.5",
          }}
        >
          Для доступа к учетной записи тренера/капитана/менеджера требуется
          специальный пароль.
        </p>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--hp-text)",
            }}
          >
            Пароль
          </label>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => onChangePassword(e.target.value)}
            placeholder="Введите пароль"
            autoFocus
            style={{
              width: "100%",
              padding: "14px",
              border: `2px solid ${passwordError ? "#d32f2f" : "var(--hp-border)"}`,
              borderRadius: "10px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSubmit();
              }
            }}
          />
          {passwordError && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
                color: "#d32f2f",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ⚠️ {passwordError}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: "var(--hp-surface-soft)",
              color: "var(--hp-muted)",
              border: "1px solid var(--hp-border)",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Отмена
          </button>
          <button
            onClick={onSubmit}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: "var(--hp-primary)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
};
