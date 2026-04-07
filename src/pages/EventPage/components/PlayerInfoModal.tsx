import { PlayerAvatar } from "src/components/PlayerAvatar";
import { PlayerDetails } from "src/pages/EventPage/types";

interface PlayerInfoModalProps {
  player: PlayerDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const getPositionName = (position: number): string => {
  switch (position) {
    case 1:
      return "Вратарь";
    case 2:
      return "Защитник";
    case 3:
      return "Нападающий";
    default:
      return "Не указано";
  }
};

const getPositionIcon = (position: number): string => {
  switch (position) {
    case 1:
      return "🥅";
    case 2:
      return "🛡️";
    case 3:
      return "⚡";
    default:
      return "🏒";
  }
};

const getHandednessName = (handedness: number): string => {
  switch (handedness) {
    case 1:
      return "Левый хват";
    case 2:
      return "Правый хват";
    default:
      return "Не указано";
  }
};

const calculateAge = (birthDate: string): number | null => {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
};

export const PlayerInfoModal = ({ player, isOpen, onClose }: PlayerInfoModalProps) => {
  if (!isOpen || !player) {
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
          backgroundColor: "white",
          borderRadius: "20px",
          maxWidth: "500px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
            borderRadius: "20px 20px 0 0",
            color: "white",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ borderRadius: "12px", overflow: "hidden" }}>
              <PlayerAvatar
                size={48}
                shape="rounded"
                photoUrl={player.photoUrl}
                jerseyNumber={player.jerseyNumber}
                fallbackBg="white"
                fallbackColor="#1a237e"
                fallbackPrefix="#"
                badgePrefix="#"
                fontSize={18}
              />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
                {player.lastName} {player.firstName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontSize: "20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                border: "1px solid #e0e0e0",
              }}
            >
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Основная позиция</div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1a237e",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{getPositionIcon(player.primaryPosition || 0)}</span>
                <span>{getPositionName(player.primaryPosition || 0)}</span>
              </div>
            </div>

            <div
              style={{
                padding: "16px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                border: "1px solid #e0e0e0",
              }}
            >
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Хват клюшки</div>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#1a237e" }}>
                {getHandednessName(player.handedness || 0)}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
            <div style={{ padding: "12px", backgroundColor: "#e3f2fd", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>📏</div>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "2px" }}>Рост</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#1976d2" }}>
                {player.height ? `${player.height} см` : "—"}
              </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "#e8f5e9", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>⚖️</div>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "2px" }}>Вес</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#2e7d32" }}>
                {player.weight ? `${player.weight} кг` : "—"}
              </div>
            </div>

            <div style={{ padding: "12px", backgroundColor: "#fff3e0", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>🎂</div>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "2px" }}>Возраст</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#ef6c00" }}>
                {player.birthDate ? `${calculateAge(player.birthDate)} лет` : "—"}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <h4
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                fontWeight: "600",
                color: "#333",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>📋</span>
              <span>Детальная информация</span>
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#666" }}>ID игрока:</span>
                <span style={{ fontWeight: "500", color: "#333" }}>{player.id.slice(0, 8)}...</span>
              </div>

              {player.email && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#666" }}>Email:</span>
                  <span style={{ fontWeight: "500", color: "#1976d2" }}>{player.email}</span>
                </div>
              )}

              {player.phone && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#666" }}>Телефон:</span>
                  <span style={{ fontWeight: "500", color: "#333" }}>{player.phone}</span>
                </div>
              )}

              {player.birthDate && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#666" }}>Дата рождения:</span>
                  <span style={{ fontWeight: "500", color: "#333" }}>
                    {new Date(player.birthDate).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              )}

              {player.secondaryPosition && player.secondaryPosition !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#666" }}>Вторая позиция:</span>
                  <span style={{ fontWeight: "500", color: "#333" }}>{getPositionName(player.secondaryPosition)}</span>
                </div>
              )}

              {player.spbhlPlayerId && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#666" }}>Профиль СПБХЛ:</span>
                  <a
                    href={`https://spbhl.ru/Player?PlayerID=${player.spbhlPlayerId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontWeight: "500", color: "#1976d2", textDecoration: "none" }}
                  >
                    Открыть
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1565c0";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1976d2";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
