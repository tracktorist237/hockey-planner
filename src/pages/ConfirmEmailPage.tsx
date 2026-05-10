import { CSSProperties, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "src/hooks/useAuth";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "20px 14px",
  background:
    "radial-gradient(circle at top left, #ccfbf1 0, transparent 34%), linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 24px 80px rgba(15, 23, 42, 0.16)",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  textAlign: "center",
};

const buttonStyle: CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: 16,
  padding: "15px 16px",
  fontSize: 17,
  fontWeight: 900,
  cursor: "pointer",
  background: "linear-gradient(135deg, #0f766e, #2563eb)",
  color: "white",
};

type Status = "loading" | "success" | "error";

export function ConfirmEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authLoading, confirmEmail, currentUser, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Подтверждаем почту...");

  const token = searchParams.get("token") ?? searchParams.get("confirmToken") ?? "";

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let isMounted = true;

    const run = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Ссылка подтверждения некорректна.");
        return;
      }

      try {
        await confirmEmail(token);

        if (!isMounted) {
          return;
        }

        setStatus("success");
        setMessage(
          isAuthenticated || currentUser
            ? "Почта подтверждена. Возвращаем в профиль..."
            : "Почта подтверждена. Теперь можно войти.",
        );

        if (isAuthenticated || currentUser) {
          window.setTimeout(() => {
            if (isMounted) {
              navigate("/profile", { replace: true });
            }
          }, 1200);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Не удалось подтвердить почту.");
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [authLoading, confirmEmail, currentUser, isAuthenticated, navigate, token]);

  const title =
    status === "loading"
      ? "Проверяем ссылку"
      : status === "success"
        ? "Почта подтверждена"
        : "Не удалось подтвердить";

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>
          {status === "loading" ? "⏳" : status === "success" ? "✅" : "⚠️"}
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 28, color: "#0f172a" }}>{title}</h1>
        <p style={{ margin: "0 0 22px", color: "#475569", fontSize: 17, lineHeight: 1.45 }}>{message}</p>

        {status !== "loading" && (
          <button
            type="button"
            style={buttonStyle}
            onClick={() => navigate(isAuthenticated || currentUser ? "/profile" : "/login", { replace: true })}
          >
            {isAuthenticated || currentUser ? "Перейти в профиль" : "Войти"}
          </button>
        )}
      </div>
    </div>
  );
}
