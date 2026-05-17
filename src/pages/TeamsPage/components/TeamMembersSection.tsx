import { useEffect, useState } from "react";
import { TeamDto, TeamMemberDto } from "src/types/teams";
import { cardStyle } from "./styles";

const TeamRole = {
  Owner: 1,
  Admin: 2,
  Member: 3,
} as const;

const memberRoleLabel = (role: number): string => {
  switch (role) {
    case TeamRole.Owner:
      return "Владелец";
    case TeamRole.Admin:
      return "Админ";
    default:
      return "Участник";
  }
};

const roleBadgeColor = (role: number) => {
  switch (role) {
    case TeamRole.Owner:
      return { background: "var(--hp-warning-border)", color: "var(--hp-warning)" };
    case TeamRole.Admin:
      return { background: "#dbeafe", color: "#1d4ed8" };
    default:
      return { background: "var(--hp-surface-soft)", color: "var(--hp-muted)" };
  }
};

interface EditableMemberRowProps {
  member: TeamMemberDto;
  canEditBadge: boolean;
  canEditRole: boolean;
  saving: boolean;
  onSave: (member: TeamMemberDto, role: number, badgeTitle: string) => void;
}

function EditableMemberRow({ member, canEditBadge, canEditRole, saving, onSave }: EditableMemberRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [role, setRole] = useState(member.role);
  const [badgeTitle, setBadgeTitle] = useState(member.badgeTitle ?? "");

  useEffect(() => {
    setRole(member.role);
    setBadgeTitle(member.badgeTitle ?? "");
  }, [member.badgeTitle, member.role]);

  const hasChanges = role !== member.role || badgeTitle.trim() !== (member.badgeTitle ?? "");
  const canSave = hasChanges && !saving && (canEditBadge || canEditRole);
  const name = `${member.lastName ?? ""} ${member.firstName ?? ""}`.trim() || "Без имени";

  const handleCancel = () => {
    setRole(member.role);
    setBadgeTitle(member.badgeTitle ?? "");
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave(member, role, badgeTitle);
    setIsEditing(false);
  };

  return (
    <div style={{ border: "1px solid var(--hp-border)", borderRadius: 14, padding: 12, background: "var(--hp-surface)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "var(--hp-text-strong)" }}>
            #{member.jerseyNumber ?? "?"} {name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
            <span style={{ borderRadius: 999, padding: "4px 8px", fontSize: 12, fontWeight: 900, ...roleBadgeColor(member.role) }}>
              {memberRoleLabel(member.role)}
            </span>
            {member.badgeTitle && (
              <span style={{ borderRadius: 999, padding: "4px 8px", fontSize: 12, fontWeight: 900, background: "#ecfeff", color: "#0e7490" }}>
                {member.badgeTitle}
              </span>
            )}
          </div>
        </div>

        {(canEditBadge || canEditRole) && (
          <button
            type="button"
            onClick={() => setIsEditing((value) => !value)}
              style={{ border: 0, borderRadius: 999, padding: "7px 10px", background: isEditing ? "#fee2e2" : "var(--hp-surface-muted)", color: isEditing ? "#991b1b" : "var(--hp-text)", fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {isEditing ? "Скрыть" : "Изменить"}
          </button>
        )}
      </div>

      {isEditing && (canEditBadge || canEditRole) && (
        <div style={{ display: "grid", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--hp-border)" }}>
          {canEditRole && member.role !== TeamRole.Owner && (
            <label style={{ display: "grid", gap: 5, fontSize: 13, color: "var(--hp-muted)", fontWeight: 800 }}>
              Права
              <select
                value={role}
                onChange={(event) => setRole(Number(event.target.value))}
                style={{ border: "1px solid var(--hp-border)", borderRadius: 10, padding: "9px 10px", fontWeight: 800 }}
              >
                <option value={TeamRole.Admin}>Админ</option>
                <option value={TeamRole.Member}>Участник</option>
              </select>
            </label>
          )}

          {canEditBadge && (
            <label style={{ display: "grid", gap: 5, fontSize: 13, color: "var(--hp-muted)", fontWeight: 800 }}>
              Бейдж
              <input
                value={badgeTitle}
                onChange={(event) => setBadgeTitle(event.target.value)}
                maxLength={32}
                placeholder="Например: Тренер, Капитан"
                style={{ border: "1px solid var(--hp-border)", borderRadius: 10, padding: "9px 10px", fontWeight: 700 }}
              />
            </label>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface)", color: "var(--hp-text)", fontWeight: 900, cursor: saving ? "default" : "pointer" }}
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              style={{
                border: 0,
                borderRadius: 12,
                padding: "10px 12px",
                background: canSave ? "var(--hp-primary)" : "var(--hp-surface-muted)",
                color: canSave ? "white" : "var(--hp-muted)",
                fontWeight: 900,
                cursor: canSave ? "pointer" : "default",
              }}
            >
              {saving ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TeamMembersSectionProps {
  team: TeamDto;
  members: TeamMemberDto[];
  loading: boolean;
  savingUserId: string | null;
  onSave: (member: TeamMemberDto, role: number, badgeTitle: string) => void;
}

export function TeamMembersSection({ team, members, loading, savingUserId, onSave }: TeamMembersSectionProps) {
  const canEditBadge = team.myRole === TeamRole.Owner || team.myRole === TeamRole.Admin;
  const canEditRole = team.myRole === TeamRole.Owner;

  return (
    <section style={{ ...cardStyle, marginTop: 14 }}>
      <div style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: "var(--hp-text-strong)" }}>Участники и права</h2>
        <div style={{ color: "var(--hp-muted)", fontSize: 14, marginTop: 3 }}>{team.name}</div>
      </div>

      <div style={{ display: "grid", gap: 10, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
        {loading && <div style={{ color: "var(--hp-muted)" }}>Загружаем участников...</div>}
        {!loading && members.length === 0 && <div style={{ color: "var(--hp-muted)" }}>Участников пока нет.</div>}
        {!loading &&
          members.map((member) => (
            <EditableMemberRow
              key={member.userId}
              member={member}
              canEditBadge={canEditBadge}
              canEditRole={canEditRole}
              saving={savingUserId === member.userId}
              onSave={onSave}
            />
          ))}
      </div>
    </section>
  );
}

