import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BottomNav } from "src/components/BottomNav";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { getEvents } from "src/api/events";
import { createTeamNews, getTeam, getTeamMembers, getTeamNews, joinPublicTeam, leaveTeam } from "src/api/teams";
import { EventLookUpDto, EventType } from "src/types/events";
import { TeamContactItem, TeamDto, TeamMemberDto, TeamNewsDto, TeamVisibility } from "src/types/teams";
import { User } from "src/types/user";
import { PlayerInfoModal } from "src/pages/EventPage/components/PlayerInfoModal";
import { usePlayerModal } from "src/pages/EventPage/hooks/usePlayerModal";
import { cardStyle } from "src/pages/TeamsPage/components/styles";
import { formatRuDateLabel } from "src/utils/date";
import { getAdaptiveFontSize } from "src/utils/text";

const TeamRole = {
  Owner: 1,
  Admin: 2,
  Member: 3,
} as const;

type TeamTab = "news" | "members" | "events";

const DESCRIPTION_LIMIT = 150;

interface TeamDetailsPageProps {
  currentUser: User | null;
  currentTeamId: string | null;
  onTeamChange: (teamId: string | null, teamName?: string | null) => void;
}

const getVisibilityText = (visibility: TeamVisibility): string =>
  visibility === TeamVisibility.Public ? "Публичная команда" : "Закрытая команда";

const getRoleText = (role?: number | null): string => {
  switch (role) {
    case TeamRole.Owner:
      return "Владелец";
    case TeamRole.Admin:
      return "Админ";
    case TeamRole.Member:
      return "Участник";
    default:
      return "Гость";
  }
};

const getEventTypeLabel = (type: number): string => {
  switch (type) {
    case EventType.Practice:
      return "Тренировка";
    case EventType.Game:
      return "Матч";
    case EventType.Meeting:
      return "Встреча";
    default:
      return "Событие";
  }
};

const canManageTeam = (team: TeamDto | null): boolean =>
  team?.myRole === TeamRole.Owner || team?.myRole === TeamRole.Admin;

const getMemberName = (member: TeamMemberDto): string =>
  `${member.lastName ?? ""} ${member.firstName ?? ""}`.trim() || "Без имени";

const getShortDescription = (description: string): string =>
  description.length > DESCRIPTION_LIMIT ? `${description.slice(0, DESCRIPTION_LIMIT).trim()}...` : description;

function ContactList({ title, items, type }: { title: string; items?: TeamContactItem[]; type: "phone" | "link" | "address" }) {
  const filledItems = (items ?? []).filter((item) => item.title?.trim() && item.value?.trim());
  if (filledItems.length === 0) {
    return null;
  }

  const renderValue = (item: TeamContactItem) => {
    if (type === "phone") {
      return <a href={`tel:${item.value}`} style={{ color: "#1d4ed8", fontWeight: 800, textDecoration: "none" }}>{item.value}</a>;
    }

    if (type === "link") {
      const href = item.value.startsWith("http") ? item.value : `https://${item.value}`;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <img
            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(href)}&sz=64`}
            alt=""
            style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0 }}
          />
          <a href={href} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 800, textDecoration: "none", overflowWrap: "anywhere" }}>
            {item.value}
          </a>
        </div>
      );
    }

    return <span style={{ color: "#475569", fontWeight: 800 }}>{item.value}</span>;
  };

  return (
    <div style={{ display: "grid", gap: 7 }}>
      <div style={{ fontSize: 13, color: "#64748b", fontWeight: 900 }}>{title}</div>
      {filledItems.map((item, index) => (
        <div key={`${item.title}-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "9px 10px", background: "#f8fafc" }}>
          <div style={{ color: "#0f172a", fontWeight: 900 }}>{item.title}</div>
          <div style={{ marginTop: 2, overflowWrap: "anywhere" }}>{renderValue(item)}</div>
        </div>
      ))}
    </div>
  );
}

function TeamEventCard({ event, onOpen }: { event: EventLookUpDto; onOpen: (eventId: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(event.id)}
      style={{
        width: "100%",
        textAlign: "left",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 12,
        background: "white",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>{event.title || getEventTypeLabel(event.type)}</div>
          <div style={{ marginTop: 5, color: "#64748b", fontWeight: 700, fontSize: 13 }}>
            {formatRuDateLabel(event.startTime)} · {getEventTypeLabel(event.type)}
          </div>
          {event.locationName && <div style={{ marginTop: 5, color: "#475569", fontSize: 13 }}>{event.locationName}</div>}
        </div>
        <div style={{ color: "#2563eb", fontWeight: 900 }}>→</div>
      </div>
    </button>
  );
}

const formatNewsDate = (value: string): string =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export function TeamDetailsPage({ currentUser, currentTeamId, onTeamChange }: TeamDetailsPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDto | null>(null);
  const [members, setMembers] = useState<TeamMemberDto[]>([]);
  const [events, setEvents] = useState<EventLookUpDto[]>([]);
  const [news, setNews] = useState<TeamNewsDto[]>([]);
  const [activeTab, setActiveTab] = useState<TeamTab>("news");
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsSaving, setNewsSaving] = useState(false);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const playerModal = usePlayerModal({ onError: setError });

  const canJoinPublic = team?.visibility === TeamVisibility.Public && !team.myRole;
  const canSeeMembers = Boolean(team?.myRole) || team?.visibility === TeamVisibility.Public;
  const isMainTeam = Boolean(team && currentTeamId === team.id);
  const hasContacts = Boolean(team && ((team.phones?.length ?? 0) > 0 || (team.links?.length ?? 0) > 0 || (team.addresses?.length ?? 0) > 0));
  const canExpandDetails = Boolean(team?.description && team.description.length > DESCRIPTION_LIMIT) || hasContacts;
  const canManage = canManageTeam(team);

  const loadTeam = useCallback(async () => {
    if (!id) {
      setError("Команда не найдена.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setTeam(await getTeam(id, currentUser?.id));
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

  const loadEvents = useCallback(async () => {
    if (!id) {
      return;
    }

    setEventsLoading(true);
    try {
      const loaded = await getEvents(currentUser?.id, id);
      setEvents(loaded.events ?? []);
    } catch (requestError) {
      console.error(requestError);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [currentUser?.id, id]);

  const loadNews = useCallback(async () => {
    if (!id) {
      return;
    }

    setNewsLoading(true);
    try {
      setNews(await getTeamNews(id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить новости команды.");
    } finally {
      setNewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    if (canSeeMembers) {
      void loadMembers();
      void loadEvents();
      void loadNews();
    }
  }, [canSeeMembers, loadEvents, loadMembers, loadNews]);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.role - b.role || getMemberName(a).localeCompare(getMemberName(b), "ru")),
    [members],
  );

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [events],
  );

  const handleJoin = async () => {
    if (!team || !currentUser?.id) {
      setError("Сначала войдите в профиль.");
      return;
    }

    if (!confirmJoin) {
      setConfirmJoin(true);
      return;
    }

    setJoining(true);
    setError(null);
    setMessage(null);
    try {
      const joined = await joinPublicTeam(team.id, currentUser.id);
      setTeam(joined);
      setMessage(`Вы вступили в команду "${joined.name}".`);
      setConfirmJoin(false);
      await loadTeam();
      await loadMembers();
      await loadEvents();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось вступить в команду.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!team || !currentUser?.id) {
      return;
    }

    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }

    setLeaving(true);
    setError(null);
    setMessage(null);
    try {
      await leaveTeam(team.id, currentUser.id);
      if (currentTeamId === team.id) {
        onTeamChange(null, null);
      }
      navigate("/teams", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось покинуть команду.");
    } finally {
      setLeaving(false);
    }
  };

  const handleSetMainTeam = () => {
    if (!team) {
      return;
    }

    onTeamChange(team.id, team.name);
    setMessage(`Команда "${team.name}" назначена основной.`);
  };

  const handleCreateNews = async () => {
    if (!team || !currentUser?.id) {
      return;
    }

    if (!newsTitle.trim() || !newsBody.trim()) {
      setError("У новости должны быть название и текст.");
      return;
    }

    setNewsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const created = await createTeamNews(team.id, { title: newsTitle.trim(), body: newsBody.trim() }, currentUser.id);
      setNews((previous) => [created, ...previous]);
      setNewsTitle("");
      setNewsBody("");
      setMessage("Новость добавлена.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось добавить новость.");
    } finally {
      setNewsSaving(false);
    }
  };

  const handleCreateEvent = () => {
    if (!team) {
      return;
    }

    onTeamChange(team.id, team.name);
    navigate("/events/create");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "16px",
        paddingBottom: "120px",
        background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
        boxSizing: "border-box",
      }}
    >
      <main style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => navigate("/teams")}
            style={{ borderRadius: 12, border: "1px solid #cbd5e1", background: "white", width: 42, height: 42, cursor: "pointer", fontSize: 20 }}
            aria-label="Назад"
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, color: "#0f172a" }}>Команда</h1>
            <div style={{ color: "#64748b", fontSize: 14 }}>Страница сообщества</div>
          </div>
        </div>

        {error && <div style={{ marginBottom: 12, background: "#fee2e2", color: "#991b1b", borderRadius: 14, padding: "12px 14px" }}>{error}</div>}
        {message && <div style={{ marginBottom: 12, background: "#dcfce7", color: "#166534", borderRadius: 14, padding: "12px 14px", fontWeight: 800 }}>{message}</div>}

        {loading && <section style={cardStyle}>Загружаем команду...</section>}

        {!loading && team && (
          <>
            <section style={{ ...cardStyle, overflow: "hidden", padding: 0 }}>
              <div
                style={{
                  height: 96,
                  background: team.coverImageUrl
                    ? `linear-gradient(rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.08)), url(${team.coverImageUrl}) center/cover`
                    : "linear-gradient(135deg, #0f766e 0%, #2563eb 55%, #7c3aed 100%)",
                }}
              />
              <div style={{ padding: "0 16px 16px" }}>
                <div
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: 24,
                    background: team.avatarUrl ? `url(${team.avatarUrl}) center/cover` : "white",
                    border: "4px solid white",
                    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.18)",
                    marginTop: -39,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 34,
                  }}
                >
                  {!team.avatarUrl && "🏒"}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginTop: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: "0 0 6px", fontSize: 30, color: "#0f172a", lineHeight: 1.05 }}>{team.name}</h2>
                    <div style={{ color: "#64748b", fontWeight: 800 }}>
                      {getVisibilityText(team.visibility)} · участников: {team.membersCount}
                    </div>
                  </div>
                  <div style={{ borderRadius: 999, padding: "7px 10px", background: "#f1f5f9", color: "#334155", fontSize: 13, fontWeight: 900, whiteSpace: "nowrap" }}>
                    {getRoleText(team.myRole)}
                  </div>
                </div>

                {team.myBadgeTitle && (
                  <div style={{ display: "inline-flex", marginTop: 10, borderRadius: 999, padding: "6px 10px", background: "#ecfeff", color: "#0e7490", fontWeight: 900 }}>
                    {team.myBadgeTitle}
                  </div>
                )}

                {(team.description || hasContacts) && (
                  <div style={{ marginTop: 12 }}>
                    {team.description && (
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.45 }}>
                        {descriptionExpanded ? team.description : getShortDescription(team.description)}
                      </p>
                    )}

                    {descriptionExpanded && hasContacts && (
                      <div style={{ display: "grid", gap: 10, marginTop: team.description ? 12 : 0 }}>
                        <ContactList title="Телефоны" type="phone" items={team.phones} />
                        <ContactList title="Ссылки" type="link" items={team.links} />
                        <ContactList title="Адреса" type="address" items={team.addresses} />
                      </div>
                    )}

                    {canExpandDetails && (
                      <button
                        type="button"
                        onClick={() => setDescriptionExpanded((value) => !value)}
                        style={{ border: 0, background: "transparent", padding: "6px 0 0", color: "#2563eb", fontWeight: 900, cursor: "pointer" }}
                      >
                        {descriptionExpanded ? "Свернуть" : "Подробнее"}
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                  {team.myRole && (
                    <button
                      type="button"
                      onClick={handleSetMainTeam}
                      disabled={isMainTeam}
                      style={{ border: 0, borderRadius: 14, padding: "12px 10px", background: isMainTeam ? "#dcfce7" : "#dbeafe", color: isMainTeam ? "#166534" : "#1d4ed8", fontWeight: 900, cursor: isMainTeam ? "default" : "pointer" }}
                    >
                      {isMainTeam ? "Основная" : "Сделать основной"}
                    </button>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => navigate(`/teams/${team.id}/manage`)}
                      style={{ border: 0, borderRadius: 14, padding: "12px 10px", background: "#0f172a", color: "white", fontWeight: 900, cursor: "pointer" }}
                    >
                      Настройки
                    </button>
                  )}
                </div>

                {team.myRole && team.myRole !== TeamRole.Owner && (
                  <div style={{ marginTop: 8 }}>
                    {confirmLeave && (
                      <div style={{ borderRadius: 14, padding: 12, background: "#fff7ed", color: "#9a3412", fontWeight: 800, lineHeight: 1.4, marginBottom: 8 }}>
                        Подтвердите выход из команды. Она пропадёт из ваших фильтров.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleLeave}
                      disabled={leaving}
                      style={{ width: "100%", border: "1px solid #fecaca", borderRadius: 14, padding: "12px 10px", background: "#fff1f2", color: "#be123c", fontWeight: 900, cursor: leaving ? "wait" : "pointer" }}
                    >
                      {leaving ? "Выходим..." : confirmLeave ? "Да, покинуть команду" : "Покинуть команду"}
                    </button>
                  </div>
                )}

                {canJoinPublic && (
                  <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                    {confirmJoin && (
                      <div style={{ borderRadius: 14, padding: 12, background: "#fff7ed", color: "#9a3412", fontWeight: 800, lineHeight: 1.4 }}>
                        Подтвердите вступление. После этого команда появится в ваших командах и в фильтрах мероприятий.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={joining}
                      style={{ border: 0, borderRadius: 14, padding: "13px 14px", background: confirmJoin ? "#0f766e" : "#2563eb", color: "white", fontWeight: 900, cursor: joining ? "wait" : "pointer", opacity: joining ? 0.72 : 1 }}
                    >
                      {joining ? "Вступаем..." : confirmJoin ? "Да, вступить в команду" : "Вступить в команду"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section style={{ ...cardStyle, marginTop: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, padding: 5, borderRadius: 16, background: "#e2e8f0", marginBottom: 12 }}>
                {([
                  ["news", "Новости"],
                  ["members", "Участники"],
                  ["events", "Мероприятия"],
                ] as Array<[TeamTab, string]>).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      border: 0,
                      borderRadius: 12,
                      padding: "10px 4px",
                      background: activeTab === tab ? "white" : "transparent",
                      color: activeTab === tab ? "#0f172a" : "#475569",
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: activeTab === tab ? "0 6px 18px rgba(15, 23, 42, 0.12)" : "none",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "news" && (
                <div style={{ display: "grid", gap: 10 }}>
                  {canManage && (
                    <div style={{ border: "1px solid #dbeafe", borderRadius: 16, padding: 12, background: "#eff6ff", display: "grid", gap: 8 }}>
                      <input
                        value={newsTitle}
                        onChange={(event) => setNewsTitle(event.target.value)}
                        placeholder="Название новости"
                        maxLength={120}
                        style={{ border: "1px solid #bfdbfe", borderRadius: 12, padding: "10px 12px", fontWeight: 800 }}
                      />
                      <textarea
                        value={newsBody}
                        onChange={(event) => setNewsBody(event.target.value)}
                        placeholder="Текст новости"
                        maxLength={2000}
                        style={{ border: "1px solid #bfdbfe", borderRadius: 12, padding: "10px 12px", minHeight: 82, resize: "vertical", fontFamily: "inherit" }}
                      />
                      <button
                        type="button"
                        onClick={() => void handleCreateNews()}
                        disabled={newsSaving}
                        style={{ border: 0, borderRadius: 12, padding: "11px 12px", background: "#2563eb", color: "white", fontWeight: 900, cursor: newsSaving ? "wait" : "pointer", opacity: newsSaving ? 0.7 : 1 }}
                      >
                        {newsSaving ? "Публикуем..." : "Добавить новость"}
                      </button>
                    </div>
                  )}

                  {newsLoading && <div style={{ color: "#64748b" }}>Загружаем новости...</div>}
                  {!newsLoading && news.length === 0 && (
                    <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, padding: 16, color: "#475569", lineHeight: 1.45, background: "#f8fafc" }}>
                      <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>Новостей пока нет</div>
                      Здесь будут объявления команды, важные предупреждения и посты капитана или тренера.
                    </div>
                  )}
                  {!newsLoading &&
                    news.map((item) => (
                      <article key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, background: "white" }}>
                        <h3 style={{ margin: "0 0 7px", color: "#0f172a", fontSize: 17 }}>{item.title}</h3>
                        <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
                          {item.authorName || "Команда"} · {formatNewsDate(item.createdAt)}
                        </div>
                        <div style={{ color: "#475569", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{item.body}</div>
                      </article>
                    ))}
                </div>
              )}

              {activeTab === "members" && (
                <div style={{ display: "grid", gap: 8 }}>
                  {membersLoading && <div style={{ color: "#64748b" }}>Загружаем участников...</div>}
                  {!membersLoading && sortedMembers.length === 0 && <div style={{ color: "#64748b" }}>Участников пока нет.</div>}
                  {!membersLoading &&
                    sortedMembers.map((member) => (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() => void playerModal.handleOpenPlayerInfo(member.userId)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: "10px 12px",
                          background: "white",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = "#f8fafc";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = "white";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <PlayerAvatar
                            size={36}
                            shape="rounded"
                            photoUrl={member.photoUrl}
                            jerseyNumber={member.jerseyNumber}
                            fallbackPrefix="#"
                            badgePrefix="#"
                            fontSize={13}
                            fallbackBg="#e8f5e9"
                            fallbackColor="#1a237e"
                          />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 900,
                                color: "#1a237e",
                                fontSize: `${getAdaptiveFontSize(getMemberName(member), {
                                  base: 15,
                                  min: 11,
                                  startShrinkAt: 18,
                                  maxLength: 40,
                                })}px`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getMemberName(member)}
                            </div>
                            {member.badgeTitle && <div style={{ color: "#0e7490", fontSize: 13, fontWeight: 900, marginTop: 2 }}>{member.badgeTitle}</div>}
                          </div>
                        </div>
                        <div style={{ color: "#2563eb", fontWeight: 900, flexShrink: 0 }}>→</div>
                      </button>
                    ))}
                </div>
              )}

              {activeTab === "events" && (
                <div style={{ display: "grid", gap: 8 }}>
                  {canManage && (
                    <button
                      type="button"
                      onClick={handleCreateEvent}
                      style={{ border: 0, borderRadius: 14, padding: "12px 14px", background: "#2563eb", color: "white", fontWeight: 900, cursor: "pointer" }}
                    >
                      + Добавить мероприятие
                    </button>
                  )}
                  {eventsLoading && <div style={{ color: "#64748b" }}>Загружаем мероприятия...</div>}
                  {!eventsLoading && sortedEvents.length === 0 && <div style={{ color: "#64748b" }}>Мероприятий этой команды пока нет.</div>}
                  {!eventsLoading && sortedEvents.map((event) => <TeamEventCard key={event.id} event={event} onOpen={(eventId) => navigate(`/events/${eventId}`)} />)}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <PlayerInfoModal player={playerModal.selectedPlayer} isOpen={playerModal.isPlayerModalOpen} onClose={playerModal.handleCloseModal} />
      <BottomNav activeTab="teams" />
    </div>
  );
}

export default TeamDetailsPage;
