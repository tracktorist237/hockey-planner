// CurrentPlayerHeader.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface CurrentPlayerHeaderProps {
  onBack?: () => void; // Опциональный пропс для совместимости
}

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
  role?: number; // 1: Coach, 2: Captain, 3: Player, 4: Manager
}

const getRoleName = (role?: number): string => {
  switch (role) {
    case 1:
      return 'Тренер';
    case 2:
      return 'Капитан';
    case 3:
      return 'Игрок';
    case 4:
      return 'Менеджер';
    default:
      return 'Игрок';
  }
};

const getRoleColor = (role?: number): string => {
  switch (role) {
    case 1: // Тренер
      return '#9c27b0'; // Фиолетовый
    case 2: // Капитан
      return '#f57c00'; // Оранжевый
    case 3: // Игрок
      return '#1976d2'; // Синий
    case 4: // Менеджер
      return '#388e3c'; // Зеленый
    default:
      return '#1976d2';
  }
};

export function CurrentPlayerHeader({
  onBack,
}: CurrentPlayerHeaderProps) {
  const navigate = useNavigate();
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

  const handleSelectPlayer = () => {
    navigate("/");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "8px 0 12px 0",
        borderBottom: "1px solid #e0e0e0",
        cursor: !currentUser ? "pointer" : "default",
        transition: "background-color 0.2s ease",
        borderRadius: "8px",
        margin: !currentUser ? "4px -4px" : "0"
      }}
      onClick={!currentUser ? handleSelectPlayer : undefined}
      onMouseEnter={(e) => {
        if (!currentUser) {
          e.currentTarget.style.backgroundColor = "#f5f5f5";
          e.currentTarget.style.padding = "8px 4px 12px 4px";
        }
      }}
      onMouseLeave={(e) => {
        if (!currentUser) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.padding = "8px 0 12px 0";
        }
      }}
    >
      {currentUser ? (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px",
          width: "100%"
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            backgroundColor: getRoleColor(currentUser.role),
            color: "white",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "20px",
            flexShrink: 0,
            boxShadow: `0 3px 8px ${getRoleColor(currentUser.role)}40`
          }}>
            {currentUser.jerseyNumber ? (
              `#${currentUser.jerseyNumber}`
            ) : (
              currentUser.firstName?.[0] || currentUser.lastName?.[0] || "?"
            )}
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
                backgroundColor: `${getRoleColor(currentUser.role)}20`,
                color: getRoleColor(currentUser.role),
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                {getRoleName(currentUser.role)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px",
          width: "100%"
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
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: "600",
              fontSize: "16px",
              color: "#1a237e",
              marginBottom: "4px"
            }}>
              Гость
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
                Без роли
              </span>
              <span>Нажмите чтобы выбрать</span>
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
          }
        `}
      </style>
    </div>
  );
}