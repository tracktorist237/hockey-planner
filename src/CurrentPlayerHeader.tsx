import { useNavigate } from "react-router-dom";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { normalizeRole, roleToLabel, UserRole } from "src/constants/roles";
import { useAuth } from "src/hooks/useAuth";
import { getRoleColor } from "src/utils/colors";
import { getAdaptiveFontSize } from "src/utils/text";

interface CurrentPlayerHeaderProps {
  onBack?: () => void;
  compact?: boolean;
  jerseyNumberOverride?: number | null;
}

const getRoleName = (role?: number | UserRole): string => roleToLabel[normalizeRole(role)];
const getColorByRole = (role?: number | UserRole): string => getRoleColor(normalizeRole(role));

export function CurrentPlayerHeader({ onBack, compact = false, jerseyNumberOverride }: CurrentPlayerHeaderProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSelectPlayer = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate("/login");
  };

  const displayName = currentUser
    ? `${currentUser.lastName ?? ""} ${currentUser.firstName ?? ""}`.trim()
    : "";
  const displayNameSize = getAdaptiveFontSize(displayName, {
    base: compact ? 15 : 18,
    min: compact ? 11 : 12,
    startShrinkAt: compact ? 16 : 18,
    maxLength: 42,
  });
  const isProfileLink = Boolean(currentUser && compact);
  const isInteractive = isProfileLink || !currentUser;

  const handleHeaderClick = () => {
    if (isProfileLink) {
      navigate("/profile");
      return;
    }
    if (!currentUser) handleSelectPlayer();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: compact ? "2px" : "8px 0 12px 0",
        borderBottom: compact ? "none" : "1px solid var(--hp-border)",
        cursor: isInteractive ? "pointer" : "default",
        transition: "background-color 0.2s ease",
        borderRadius: compact ? "12px" : "8px",
        margin: !currentUser ? "4px -4px" : "0",
      }}
      onClick={isInteractive ? handleHeaderClick : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isProfileLink ? "Открыть профиль" : !currentUser ? "Выбрать пользователя" : undefined}
      onKeyDown={(event) => {
        if (isInteractive && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          handleHeaderClick();
        }
      }}
      onMouseEnter={(event) => {
        if (isInteractive) {
          event.currentTarget.style.backgroundColor = "var(--hp-surface-hover)";
          if (!compact) event.currentTarget.style.padding = "8px 4px 12px 4px";
        }
      }}
      onMouseLeave={(event) => {
        if (isInteractive) {
          event.currentTarget.style.backgroundColor = "transparent";
          if (!compact) event.currentTarget.style.padding = "8px 0 12px 0";
        }
      }}
    >
      {currentUser ? (
        <div style={{ display: "flex", alignItems: "center", gap: compact ? "9px" : "12px", width: "100%" }}>
          <div
            style={{
              boxShadow: compact ? `0 2px 6px ${getColorByRole(currentUser.role)}30` : `0 3px 8px ${getColorByRole(currentUser.role)}40`,
              borderRadius: compact ? "10px" : "12px",
            }}
          >
            <PlayerAvatar
              size={compact ? 38 : 48}
              shape="rounded"
              photoUrl={currentUser.photoUrl}
              jerseyNumber={jerseyNumberOverride ?? currentUser.jerseyNumber}
              fallbackBg={getColorByRole(currentUser.role)}
              fallbackColor="white"
              fallbackPrefix="#"
              badgePrefix="#"
              fontSize={compact ? 13 : 16}
              badgeSizePx={compact ? 15 : 18}
              badgeFontSizePx={compact ? 8 : 10}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: "600",
                fontSize: `${displayNameSize}px`,
                color: "var(--hp-heading)",
                marginBottom: compact ? "2px" : "4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: compact ? "min(48vw, 240px)" : "200px",
              }}
            >
              {currentUser.lastName} {currentUser.firstName}
            </div>
            <div
              style={{
                fontSize: compact ? "11px" : "13px",
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
                  padding: compact ? "1px 7px" : "2px 8px",
                  borderRadius: "10px",
                  fontSize: compact ? "10px" : "12px",
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
