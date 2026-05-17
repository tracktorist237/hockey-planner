import { useNavigate } from "react-router-dom";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { normalizeRole, roleToLabel, UserRole } from "src/constants/roles";
import { useAuth } from "src/hooks/useAuth";
import { getRoleColor } from "src/utils/colors";
import { getAdaptiveFontSize } from "src/utils/text";

interface CurrentPlayerHeaderProps {
  onBack?: () => void;
}

const getRoleName = (role?: number | UserRole): string => roleToLabel[normalizeRole(role)];
const getColorByRole = (role?: number | UserRole): string => getRoleColor(normalizeRole(role));

export function CurrentPlayerHeader({ onBack }: CurrentPlayerHeaderProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSelectPlayer = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate("/start-search");
  };

  const displayName = currentUser
    ? `${currentUser.lastName ?? ""} ${currentUser.firstName ?? ""}`.trim()
    : "";
  const displayNameSize = getAdaptiveFontSize(displayName, {
    base: 18,
    min: 12,
    startShrinkAt: 18,
    maxLength: 42,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "8px 0 12px 0",
        borderBottom: "1px solid var(--hp-border)",
        cursor: !currentUser ? "pointer" : "default",
        transition: "background-color 0.2s ease",
        borderRadius: "8px",
        margin: !currentUser ? "4px -4px" : "0",
      }}
      onClick={!currentUser ? handleSelectPlayer : undefined}
      onMouseEnter={(event) => {
        if (!currentUser) {
          event.currentTarget.style.backgroundColor = "var(--hp-surface-hover)";
          event.currentTarget.style.padding = "8px 4px 12px 4px";
        }
      }}
      onMouseLeave={(event) => {
        if (!currentUser) {
          event.currentTarget.style.backgroundColor = "transparent";
          event.currentTarget.style.padding = "8px 0 12px 0";
        }
      }}
    >
      {currentUser ? (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
          <div
            style={{
              boxShadow: `0 3px 8px ${getColorByRole(currentUser.role)}40`,
              borderRadius: "12px",
            }}
          >
            <PlayerAvatar
              size={48}
              shape="rounded"
              photoUrl={currentUser.photoUrl}
              jerseyNumber={currentUser.jerseyNumber}
              fallbackBg={getColorByRole(currentUser.role)}
              fallbackColor="white"
              fallbackPrefix="#"
              badgePrefix="#"
              fontSize={16}
              badgeSizePx={18}
              badgeFontSizePx={10}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: "600",
                fontSize: `${displayNameSize}px`,
                color: "var(--hp-heading)",
                marginBottom: "4px",
                whiteSpace: "nowrap",
                maxWidth: "200px",
              }}
            >
              {currentUser.lastName} {currentUser.firstName}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--hp-muted)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  backgroundColor: `${getColorByRole(currentUser.role)}20`,
                  color: getColorByRole(currentUser.role),
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {getRoleName(currentUser.role)}
              </span>
              {currentUser.emailConfirmed === false && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate("/profile");
                  }}
                  style={{
                    border: "1px solid var(--hp-warning-border)",
                    background: "var(--hp-warning-soft)",
                    color: "var(--hp-warning)",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  title="Подтвердите почту, чтобы восстановить доступ к профилю"
                >
                  Подтвердить почту
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "var(--hp-surface-muted)",
              color: "var(--hp-muted)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "400",
              fontSize: "24px",
              flexShrink: 0,
            }}
          >
            👤
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: "600",
                fontSize: "16px",
                color: "var(--hp-heading)",
                marginBottom: "4px",
              }}
            >
              Гость
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "var(--hp-muted)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  backgroundColor: "#fff3e0",
                  color: "var(--hp-warning)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                Без роли
              </span>
              <span>Нажмите чтобы выбрать</span>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
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
