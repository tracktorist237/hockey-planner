import { useState } from "react";
import { TeamDto, TeamVisibility } from "src/types/teams";

interface TeamCardProps {
  team: TeamDto;
  actionText?: string;
  actionTone?: "blue" | "green" | "muted";
  isPinned?: boolean;
  onTogglePin?: () => void;
  onAction?: () => void;
}

const getVisibilityText = (visibility: TeamVisibility): string =>
  visibility === TeamVisibility.Public ? "Публичная" : "Закрытая";

const getRoleText = (role?: number | null): string | null => {
  switch (role) {
    case 1:
      return "Владелец";
    case 2:
      return "Админ";
    case 3:
      return "Участник";
    default:
      return null;
  }
};

export function TeamCard({ team, actionText, actionTone = "blue", isPinned, onTogglePin, onAction }: TeamCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const actionColors = {
    blue: { background: "var(--hp-primary-soft)", color: "var(--hp-primary-text)" },
    green: { background: "var(--hp-success-soft)", color: "var(--hp-success)" },
    muted: { background: "var(--hp-surface-muted)", color: "var(--hp-text)" },
  }[actionTone];
  const myRoleText = getRoleText(team.myRole);
  const initials = team.name.trim().slice(0, 2).toUpperCase() || "ХК";

  return (
    <div style={{ position: "relative", border: "1px solid var(--hp-border)", borderRadius: 14, padding: 12, background: "var(--hp-surface)" }}>
      {onTogglePin && (
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 6 }}>
          {isPinned && <span style={{ color: "var(--hp-warning)", fontSize: 18 }} title="Закреплено">📌</span>}
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            title="Действия"
            style={{
              width: "34px",
              height: "32px",
              border: "1px solid var(--hp-border)",
              borderRadius: 12,
              padding: "0",
              background: "var(--hp-surface-soft)",
              color: "var(--hp-text)",
              fontWeight: 900,
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
            }}
          >
            ⋯
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "48px minmax(0, 1fr)", gap: 12, alignItems: "flex-start", paddingRight: onTogglePin ? 52 : 0 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: team.avatarUrl ? `url(${team.avatarUrl}) center/cover` : "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            fontSize: 15,
            flexShrink: 0,
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
          }}
        >
          {!team.avatarUrl && initials}
        </div>
        <div style={{ minWidth: 0, textAlign: "left" }}>
          <div style={{ fontWeight: 900, color: "var(--hp-text-strong)", fontSize: 17, overflowWrap: "anywhere", lineHeight: 1.18 }}>{team.name}</div>
          <div style={{ fontSize: 14, color: "var(--hp-muted)", marginTop: 4 }}>
            {getVisibilityText(team.visibility)} · участников: {team.membersCount}
          </div>
          {(myRoleText || team.myBadgeTitle) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {myRoleText && (
                <span style={{ borderRadius: 999, padding: "4px 8px", background: "var(--hp-surface-muted)", color: "var(--hp-text)", fontSize: 12, fontWeight: 900 }}>
                  {myRoleText}
                </span>
              )}
              {team.myBadgeTitle && (
                <span style={{ borderRadius: 999, padding: "4px 8px", background: "var(--hp-primary-soft)", color: "var(--hp-primary-text)", fontSize: 12, fontWeight: 900 }}>
                  {team.myBadgeTitle}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {isMenuOpen && onTogglePin && (
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(false);
            onTogglePin();
          }}
          style={{
            marginTop: 10,
            width: "100%",
            border: "1px solid var(--hp-warning-border)",
            borderRadius: 12,
            padding: "10px 12px",
            background: "var(--hp-warning-soft)",
            color: "var(--hp-warning)",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {isPinned ? "Открепить" : "Закрепить сверху"}
        </button>
      )}

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            marginTop: 10,
            width: "100%",
            border: 0,
            borderRadius: 12,
            padding: "11px 12px",
            fontWeight: 800,
            cursor: "pointer",
            ...actionColors,
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
