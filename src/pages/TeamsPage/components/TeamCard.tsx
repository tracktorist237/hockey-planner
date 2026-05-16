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
  const actionColors = {
    blue: { background: "#dbeafe", color: "#1d4ed8" },
    green: { background: "#dcfce7", color: "#166534" },
    muted: { background: "#f1f5f9", color: "#334155" },
  }[actionTone];
  const myRoleText = getRoleText(team.myRole);
  const initials = team.name.trim().slice(0, 2).toUpperCase() || "ХК";

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, background: "white" }}>
      <div style={{ display: "grid", gridTemplateColumns: "48px minmax(0, 1fr)", gap: 12, alignItems: "flex-start" }}>
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
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 17, overflowWrap: "anywhere", lineHeight: 1.18 }}>{team.name}</div>
          <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            {getVisibilityText(team.visibility)} · участников: {team.membersCount}
          </div>
          {(myRoleText || team.myBadgeTitle) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {myRoleText && (
                <span style={{ borderRadius: 999, padding: "4px 8px", background: "#f1f5f9", color: "#334155", fontSize: 12, fontWeight: 900 }}>
                  {myRoleText}
                </span>
              )}
              {team.myBadgeTitle && (
                <span style={{ borderRadius: 999, padding: "4px 8px", background: "#ecfeff", color: "#0e7490", fontSize: 12, fontWeight: 900 }}>
                  {team.myBadgeTitle}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {onTogglePin && (
        <button
          type="button"
          onClick={onTogglePin}
          style={{
            marginTop: 10,
            width: "100%",
            border: "1px solid #fde68a",
            borderRadius: 12,
            padding: "9px 12px",
            background: isPinned ? "#fef3c7" : "#fffbeb",
            color: "#92400e",
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
