// CurrentPlayerHeader.tsx
import { useEffect, useState } from "react";

interface CurrentPlayerHeaderProps {
  onBack?: () => void; // Опциональный пропс для совместимости
}

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
}

export function CurrentPlayerHeader({
  onBack,
}: CurrentPlayerHeaderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Получаем пользователя из localStorage при монтировании
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Ошибка при парсинге пользователя:", e);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    // Если нужно перезагрузить страницу для обновления состояния
    window.location.reload();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: currentUser ? "space-between" : "flex-start",
        padding: "12px 0 16px 0",
        marginBottom: "8px",
        borderBottom: "1px solid #e0e0e0"
      }}
    >
      {currentUser ? (
        <>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#1976d2",
              color: "white",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "20px",
              flexShrink: 0,
              boxShadow: "0 3px 8px rgba(25, 118, 210, 0.3)"
            }}>
              #{currentUser.jerseyNumber || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: "600",
                fontSize: "18px",
                color: "#1a237e",
                marginBottom: "4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "200px"
              }}>
                {currentUser.lastName} {currentUser.firstName}
              </div>
              <div style={{ 
                fontSize: "13px",
                color: "#666",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span style={{
                  backgroundColor: "#e3f2fd",
                  color: "#1976d2",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: "500"
                }}>
                  Игрок
                </span>
                <span>ID: {currentUser.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f5f5f5",
              color: "#666",
              border: "1px solid #e0e0e0",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#ffebee";
              e.currentTarget.style.borderColor = "#d32f2f";
              e.currentTarget.style.color = "#d32f2f";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
              e.currentTarget.style.borderColor = "#e0e0e0";
              e.currentTarget.style.color = "#666";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Выйти
          </button>
        </>
      ) : (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px"
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            backgroundColor: "#f5f5f5",
            color: "#999",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "400",
            fontSize: "24px",
            flexShrink: 0
          }}>
            👤
          </div>
          <div>
            <div style={{ 
              fontWeight: "500",
              fontSize: "16px",
              color: "#999",
              marginBottom: "4px"
            }}>
              Не авторизован
            </div>
            <div style={{ 
              fontSize: "14px",
              color: "#666",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span style={{
                backgroundColor: "#fff3e0",
                color: "#ef6c00",
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: "500"
              }}>
                Гость
              </span>
              <span>Войдите для участия</span>
            </div>
          </div>
        </div>
      )}
      
      <style>
        {`
          /* Для очень маленьких экранов */
          @media (max-width: 360px) {
            div[style*="gap: 12px"] {
              gap: 8px !important;
            }
            
            div[style*="fontSize: 18px"] {
              font-size: 16px !important;
            }
            
            button[style*="padding: 8px 16px"] {
              padding: 6px 12px !important;
              font-size: 13px !important;
            }
          }
          
          button:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
          }
        `}
      </style>
    </div>
  );
}