import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BottomNav } from "src/components/BottomNav";
import { getTeam, getTeamMembers, updateTeam, updateTeamMember } from "src/api/teams";
import { TeamContactItem, TeamDto, TeamMemberDto, TeamVisibility } from "src/types/teams";
import { User } from "src/types/user";
import { TeamMembersSection } from "src/pages/TeamsPage/components/TeamMembersSection";
import { cardStyle, inputStyle } from "src/pages/TeamsPage/components/styles";

const TeamRole = {
  Owner: 1,
  Admin: 2,
  Member: 3,
} as const;

interface TeamManagePageProps {
  currentUser: User | null;
}

interface TeamFormState {
  name: string;
  description: string;
  avatarUrl: string;
  coverImageUrl: string;
  visibility: TeamVisibility;
  phones: TeamContactItem[];
  links: TeamContactItem[];
  addresses: TeamContactItem[];
}

const canManageTeam = (team: TeamDto | null): boolean =>
  team?.myRole === TeamRole.Owner || team?.myRole === TeamRole.Admin;

const getMemberName = (member: TeamMemberDto): string =>
  `${member.lastName ?? ""} ${member.firstName ?? ""}`.trim() || "Без имени";

const emptyContact = (): TeamContactItem => ({ title: "", value: "" });

function ContactItemsEditor({
  title,
  titlePlaceholder,
  valuePlaceholder,
  items,
  onChange,
}: {
  title: string;
  titlePlaceholder: string;
  valuePlaceholder: string;
  items: TeamContactItem[];
  onChange: (items: TeamContactItem[]) => void;
}) {
  const visibleItems = items.length > 0 ? items : [emptyContact()];

  const updateItem = (index: number, field: keyof TeamContactItem, value: string) => {
    const next = [...visibleItems];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(visibleItems.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 900, color: "var(--hp-heading)", fontSize: 14 }}>{title}</div>
      {visibleItems.map((item, index) => (
        <div key={index} style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.3fr) auto", gap: 8 }}>
          <input value={item.title} onChange={(event) => updateItem(index, "title", event.target.value)} placeholder={titlePlaceholder} style={inputStyle} />
          <input value={item.value} onChange={(event) => updateItem(index, "value", event.target.value)} placeholder={valuePlaceholder} style={inputStyle} />
          <button
            type="button"
            onClick={() => removeItem(index)}
            style={{ border: "1px solid var(--hp-danger-border)", borderRadius: 12, background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 900, padding: "0 10px", cursor: "pointer" }}
            aria-label="Удалить пункт"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...visibleItems, emptyContact()])}
        style={{ border: "1px dashed var(--hp-info-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-info-soft)", color: "var(--hp-info)", fontWeight: 900, cursor: "pointer" }}
      >
        Добавить пункт
      </button>
    </div>
  );
}

export function TeamManagePage({ currentUser }: TeamManagePageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDto | null>(null);
  const [members, setMembers] = useState<TeamMemberDto[]>([]);
  const [form, setForm] = useState<TeamFormState>({
    name: "",
    description: "",
    avatarUrl: "",
    coverImageUrl: "",
    visibility: TeamVisibility.Public,
    phones: [],
    links: [],
    addresses: [],
  });
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [teamSaving, setTeamSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    if (!id) {
      setError("Команда не найдена.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const loadedTeam = await getTeam(id, currentUser?.id);
      setTeam(loadedTeam);
      setForm({
        name: loadedTeam.name,
        description: loadedTeam.description ?? "",
        avatarUrl: loadedTeam.avatarUrl ?? "",
        coverImageUrl: loadedTeam.coverImageUrl ?? "",
        visibility: loadedTeam.visibility,
        phones: loadedTeam.phones ?? [],
        links: loadedTeam.links ?? [],
        addresses: loadedTeam.addresses ?? [],
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить команду.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, id]);

  const loadMembers = useCallback(async () => {
    if (!id) {
      return;
    }

    setMembersLoading(true);
    try {
      setMembers(await getTeamMembers(id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить участников команды.");
    } finally {
      setMembersLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTeam();
    void loadMembers();
  }, [loadMembers, loadTeam]);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.role - b.role || getMemberName(a).localeCompare(getMemberName(b), "ru")),
    [members],
  );

  const saveTeam = async (successMessage: string) => {
    if (!team || !currentUser?.id) {
      return;
    }

    const updated = await updateTeam(
      team.id,
      {
        name: form.name,
        description: form.description || null,
        avatarUrl: form.avatarUrl || null,
        coverImageUrl: form.coverImageUrl || null,
        phones: form.phones,
        links: form.links,
        addresses: form.addresses,
        visibility: form.visibility,
      },
      currentUser.id,
    );
    setTeam(updated);
    setMessage(successMessage);
  };

  const handleCopyInviteCode = async () => {
    if (!team?.inviteCode) {
      return;
    }

    await navigator.clipboard.writeText(team.inviteCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1800);
  };

  const handleSaveTeam = async () => {
    setTeamSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveTeam("Команда обновлена.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось обновить команду.");
    } finally {
      setTeamSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setPrivacySaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveTeam("Настройки приватности сохранены.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить приватность.");
    } finally {
      setPrivacySaving(false);
    }
  };

  const handleSaveMember = async (member: TeamMemberDto, role: number, badgeTitle: string) => {
    if (!team || !currentUser?.id) {
      return;
    }

    setSavingUserId(member.userId);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateTeamMember(team.id, member.userId, { role, badgeTitle }, currentUser.id);
      setMembers((previous) => previous.map((value) => (value.userId === updated.userId ? updated : value)));
      setMessage("Участник обновлён.");
      await loadTeam();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось обновить участника.");
    } finally {
      setSavingUserId(null);
    }
  };

  const isDenied = !loading && team && !canManageTeam(team);
  const isPublic = form.visibility === TeamVisibility.Public;

  return (
    <div style={{ minHeight: "100vh", padding: "16px", paddingBottom: "120px", background: "linear-gradient(135deg, var(--hp-surface-soft) 0%, var(--hp-info-soft) 100%)", boxSizing: "border-box" }}>
      <main style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate(id ? `/teams/${id}` : "/teams")} style={{ borderRadius: 12, border: "1px solid var(--hp-border)", background: "var(--hp-surface)", width: 42, height: 42, cursor: "pointer", fontSize: 20 }} aria-label="Назад">
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, color: "var(--hp-text-strong)" }}>Настройки команды</h1>
            <div style={{ color: "var(--hp-muted)", fontSize: 14 }}>{team?.name ?? "Оформление, права и приглашения"}</div>
          </div>
        </div>

        {error && <div style={{ marginBottom: 12, background: "var(--hp-danger-soft)", color: "var(--hp-danger)", borderRadius: 14, padding: "12px 14px" }}>{error}</div>}
        {message && <div style={{ marginBottom: 12, background: "var(--hp-success-soft)", color: "var(--hp-success)", borderRadius: 14, padding: "12px 14px", fontWeight: 800 }}>{message}</div>}
        {loading && <section style={cardStyle}>Загружаем настройки...</section>}

        {isDenied && (
          <section style={cardStyle}>
            <h2 style={{ margin: "0 0 8px", color: "var(--hp-text-strong)" }}>Недостаточно прав</h2>
            <p style={{ margin: 0, color: "var(--hp-muted)", lineHeight: 1.45 }}>Настройки команды доступны только владельцу и администраторам.</p>
          </section>
        )}

        {!loading && team && canManageTeam(team) && (
          <>
            <section style={cardStyle}>
              <h2 style={{ margin: "0 0 10px", fontSize: 20, color: "var(--hp-text-strong)" }}>Оформление сообщества</h2>
              <div style={{ display: "grid", gap: 10 }}>
                <input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="Название команды" style={inputStyle} />
                <textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} placeholder="Описание команды" style={{ ...inputStyle, minHeight: 82, resize: "vertical", fontFamily: "inherit" }} />
                <input value={form.avatarUrl} onChange={(event) => setForm((value) => ({ ...value, avatarUrl: event.target.value }))} placeholder="Ссылка на аватарку команды" style={inputStyle} />
                <input value={form.coverImageUrl} onChange={(event) => setForm((value) => ({ ...value, coverImageUrl: event.target.value }))} placeholder="Ссылка на обои / обложку" style={inputStyle} />
                <ContactItemsEditor title="Телефоны" titlePlaceholder="Название: Капитан" valuePlaceholder="Телефон" items={form.phones} onChange={(phones) => setForm((value) => ({ ...value, phones }))} />
                <ContactItemsEditor title="Ссылки" titlePlaceholder="Название: Чат команды" valuePlaceholder="Ссылка" items={form.links} onChange={(links) => setForm((value) => ({ ...value, links }))} />
                <ContactItemsEditor title="Адреса" titlePlaceholder="Название: Домашняя арена" valuePlaceholder="Адрес" items={form.addresses} onChange={(addresses) => setForm((value) => ({ ...value, addresses }))} />
                <button type="button" onClick={handleSaveTeam} disabled={teamSaving} style={{ border: 0, borderRadius: 14, padding: "13px 14px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: teamSaving ? "wait" : "pointer", opacity: teamSaving ? 0.72 : 1 }}>
                  {teamSaving ? "Сохраняем..." : "Сохранить оформление"}
                </button>
              </div>
            </section>

            <section style={{ ...cardStyle, marginTop: 14 }}>
              <h2 style={{ margin: "0 0 10px", fontSize: 20, color: "var(--hp-text-strong)" }}>Приглашение</h2>
              {team.inviteCode ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
                  <div style={{ background: "var(--hp-surface-soft)", border: "1px dashed var(--hp-border)", borderRadius: 14, padding: "10px 12px" }}>
                    <div style={{ fontSize: 12, color: "var(--hp-muted)", fontWeight: 800 }}>Код приглашения</div>
                    <div style={{ fontSize: 20, color: "var(--hp-text-strong)", fontWeight: 900, letterSpacing: 1 }}>{team.inviteCode}</div>
                  </div>
                  <button type="button" onClick={handleCopyInviteCode} style={{ border: 0, borderRadius: 14, padding: "14px 12px", background: copySuccess ? "var(--hp-success-soft)" : "var(--hp-primary-soft)", color: copySuccess ? "var(--hp-success)" : "var(--hp-info)", fontWeight: 900, cursor: "pointer" }}>
                    {copySuccess ? "Скопировано" : "Копировать"}
                  </button>
                </div>
              ) : (
                <div style={{ color: "var(--hp-muted)" }}>Код приглашения недоступен.</div>
              )}
            </section>

            <TeamMembersSection team={team} members={sortedMembers} loading={membersLoading} savingUserId={savingUserId} onSave={handleSaveMember} />

            <section style={{ ...cardStyle, marginTop: 14, borderColor: "var(--hp-danger-border)", background: "linear-gradient(180deg, var(--hp-surface) 0%, var(--hp-danger-soft) 100%)" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, color: "var(--hp-danger)" }}>Опасная зона</h2>
              <p style={{ margin: "0 0 12px", color: "var(--hp-danger)", lineHeight: 1.45 }}>
                Эти настройки влияют на доступ к команде. Публичную команду видно в поиске, в неё можно вступить с подтверждением. Закрытая команда доступна только по коду приглашения.
              </p>

              <div style={{ display: "grid", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setForm((value) => ({ ...value, visibility: isPublic ? TeamVisibility.Private : TeamVisibility.Public }))}
                  style={{
                    border: `2px solid ${isPublic ? "#16a34a" : "#f97316"}`,
                    borderRadius: 16,
                    padding: 12,
                    background: isPublic ? "var(--hp-success-soft)" : "var(--hp-warning-soft)",
                    color: isPublic ? "var(--hp-success)" : "var(--hp-warning)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>{isPublic ? "Команда публичная" : "Команда закрытая"}</div>
                      <div style={{ marginTop: 3, fontSize: 13, fontWeight: 700 }}>{isPublic ? "Видна в поиске команд" : "Вступление только по коду"}</div>
                    </div>
                    <div style={{ width: 54, height: 30, borderRadius: 999, background: isPublic ? "#22c55e" : "#fb923c", padding: 3, boxSizing: "border-box", flexShrink: 0 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--hp-surface)", transform: isPublic ? "translateX(24px)" : "translateX(0)", transition: "transform 0.15s ease" }} />
                    </div>
                  </div>
                </button>

                <button type="button" onClick={handleSavePrivacy} disabled={privacySaving} style={{ border: "1px solid var(--hp-danger-border)", borderRadius: 14, padding: "13px 14px", background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 900, cursor: privacySaving ? "wait" : "pointer", opacity: privacySaving ? 0.72 : 1 }}>
                  {privacySaving ? "Сохраняем..." : "Сохранить приватность"}
                </button>

                <div style={{ borderTop: "1px solid var(--hp-danger-border)", paddingTop: 10, color: "var(--hp-danger)", fontSize: 14, lineHeight: 1.45 }}>
                  Удаление команды пока недоступно: сначала нужно добавить безопасную передачу владения и подтверждение действия.
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav activeTab="teams" />
    </div>
  );
}

export default TeamManagePage;
