import { roleToLabel, UserRole } from "../../../constants/roles";
import { User } from "../../../types/user";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { getAdaptiveFontSize } from "src/utils/text";

interface PlayerListProps {
  users: User[];
  loading: boolean;
  onSelectUser: (user: User) => void;
}

const isSpecialRole = (user: User): boolean => user.role !== UserRole.Player;

export const PlayerList = ({ users, loading, onSelectUser }: PlayerListProps) => {
  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "12px",
        maxHeight: "300px",
        overflowY: "auto",
        backgroundColor: "#fff",
        marginBottom: "20px",
      }}
    >
      {loading ? (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            color: "#666",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              border: "2px solid #e0e0e0",
              borderTopColor: "#1976d2",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 12px auto",
            }}
          />
          Загрузка списка игроков...
        </div>
      ) : users.length > 0 ? (
        users.map((user) => {
          const isSpecial = isSpecialRole(user);

          return (
            <div
              key={user.id}
              style={{
                padding: "16px",
                borderBottom: "1px solid #f0f0f0",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
              onClick={() => onSelectUser(user)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
              }}
            >
              <PlayerAvatar
                size={36}
                shape="rounded"
                photoUrl={user.photoUrl}
                jerseyNumber={user.jerseyNumber}
                fallbackPrefix="#"
                badgePrefix="#"
                fallbackBg={isSpecial ? "#f57c00" : "#1976d2"}
                fallbackColor="white"
                fontSize={13}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: `${getAdaptiveFontSize(`${user.firstName ?? ""} ${user.lastName ?? ""}`, {
                      base: 16,
                      min: 12,
                      startShrinkAt: 18,
                      maxLength: 40,
                    })}px`,
                    marginBottom: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.firstName} {user.lastName}
                  {isSpecial && (
                    <span
                      style={{
                        fontSize: "11px",
                        backgroundColor: "#fff3e0",
                        color: "#f57c00",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {roleToLabel[user.role]}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  ID: {user.id.slice(0, 8)}...
                </div>
              </div>
              <div
                style={{
                  fontSize: "20px",
                  color: "#666",
                  opacity: 0.7,
                }}
              >
                {isSpecial ? "🔒" : "→"}
              </div>
            </div>
          );
        })
      ) : (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            color: "#666",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
              opacity: 0.3,
            }}
          >
            👤
          </div>
          <div style={{ marginBottom: "8px", fontWeight: "500" }}>
            Игрок не найден
          </div>
          <div style={{ fontSize: "14px", color: "#999" }}>
            Попробуйте другой запрос или добавьте себя
          </div>
        </div>
      )}
    </div>
  );
};
