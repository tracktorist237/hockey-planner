import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { TeamTablesPanel } from "src/components/TeamTablesPanel";
import { getEvents } from "src/api/events";
import { createTeamNews, deleteTeamNews, getTeam, getTeamMembers, getTeamNews, joinPublicTeam, leaveTeam, updateTeamNews, uploadTeamNewsImage } from "src/api/teams";
import { EventLookUpDto, EventType } from "src/types/events";
import { TeamContactItem, TeamDto, TeamMemberDto, TeamNewsDto, TeamVisibility } from "src/types/teams";
import { User } from "src/types/user";
import { PlayerInfoModal } from "src/pages/EventPage/components/PlayerInfoModal";
import { usePlayerModal } from "src/pages/EventPage/hooks/usePlayerModal";
import { useTeamPwaInstall } from "src/hooks/useTeamPwaInstall";
import { setTeamPwaPreferences, TeamPwaStartPage } from "src/utils/teamPwa";
import { cardStyle } from "src/pages/TeamsPage/components/styles";
import { formatRuDateLabel } from "src/utils/date";
import { getAdaptiveFontSize } from "src/utils/text";
import { useSwipeToDismiss } from "src/hooks/useSwipeToDismiss";
import { useSwipeTabs } from "src/hooks/useSwipeTabs";

const TeamRole = {
  Owner: 1,
  Admin: 2,
  Member: 3,
} as const;

type TeamTab = "news" | "tables" | "members" | "events";
const teamTabs: readonly TeamTab[] = ["news", "tables", "members", "events"];

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
      return <a href={`tel:${item.value}`} style={{ color: "var(--hp-info)", fontWeight: 800, textDecoration: "none" }}>{item.value}</a>;
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
          <a href={href} target="_blank" rel="noreferrer" style={{ color: "var(--hp-info)", fontWeight: 800, textDecoration: "none", overflowWrap: "anywhere" }}>
            {item.value}
          </a>
        </div>
      );
    }

    return <span style={{ color: "var(--hp-muted)", fontWeight: 800 }}>{item.value}</span>;
  };

  return (
    <div style={{ display: "grid", gap: 7 }}>
      <div style={{ fontSize: 13, color: "var(--hp-muted)", fontWeight: 900 }}>{title}</div>
      {filledItems.map((item, index) => (
        <div key={`${item.title}-${index}`} style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "9px 10px", background: "var(--hp-surface-soft)" }}>
          <div style={{ color: "var(--hp-text-strong)", fontWeight: 900 }}>{item.title}</div>
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
        border: "1px solid var(--hp-border)",
        borderRadius: 14,
        padding: 12,
        background: "var(--hp-surface)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: "var(--hp-text-strong)", fontSize: 16 }}>{event.title || getEventTypeLabel(event.type)}</div>
          <div style={{ marginTop: 5, color: "var(--hp-muted)", fontWeight: 700, fontSize: 13 }}>
            {formatRuDateLabel(event.startTime)} · {getEventTypeLabel(event.type)}
          </div>
          {event.locationName && <div style={{ marginTop: 5, color: "var(--hp-muted)", fontSize: 13 }}>{event.locationName}</div>}
        </div>
        <div style={{ color: "var(--hp-primary)", fontWeight: 900 }}>→</div>
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
  const teamTabsSwipeHandlers = useSwipeTabs({ tabs: teamTabs, activeTab, onChange: setActiveTab });
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsSaving, setNewsSaving] = useState(false);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [newsImageUploading, setNewsImageUploading] = useState(false);
  const [newsSendNotification, setNewsSendNotification] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingNewsTitle, setEditingNewsTitle] = useState("");
  const [editingNewsBody, setEditingNewsBody] = useState("");
  const [editingNewsImageUrl, setEditingNewsImageUrl] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [newsDeletingId, setNewsDeletingId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmJoin, setConfirmJoin] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const [isTeamInstallDialogOpen, setIsTeamInstallDialogOpen] = useState(false);
  const [teamAppName, setTeamAppName] = useState("");
  const [teamAppStartPage, setTeamAppStartPage] = useState<TeamPwaStartPage>("team");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { sheetRef: installSheetRef, handleProps: installSheetHandleProps } = useSwipeToDismiss(() => setIsTeamInstallDialogOpen(false));
  const playerModal = usePlayerModal({ onError: setError });
  const loadedTeamId = team?.id ?? null;
  const loadedTeamName = team?.name ?? "";
  const teamPwaInstall = useTeamPwaInstall(team, {
    appName: teamAppName,
  });

  useEffect(() => {
    if (loadedTeamId && loadedTeamName) {
      setTeamAppName(loadedTeamName);
      setTeamAppStartPage("team");
    }
  }, [loadedTeamId, loadedTeamName]);

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
      setNews(await getTeamNews(id, currentUser?.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить новости команды.");
    } finally {
      setNewsLoading(false);
    }
  }, [currentUser?.id, id]);

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
      setIsTeamMenuOpen(true);
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

  const handleInstallTeamApp = async () => {
    setError(null);

    if (team) {
      setTeamPwaPreferences(team.id, {
        startPage: teamAppStartPage,
        teamName: team.name,
        appName: teamAppName.trim() || team.name,
      });
    }

    const result = await teamPwaInstall.install();
    if (result === "redirected") {
      return;
    }

    setError("Не удалось подготовить полноценную PWA-установку. Обновите страницу и попробуйте ещё раз.");
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
      const created = await createTeamNews(team.id, { title: newsTitle.trim(), body: newsBody.trim(), imageUrl: newsImageUrl.trim() || null, sendNotification: newsSendNotification }, currentUser.id);
      setNews((previous) => [created, ...previous]);
      setNewsTitle("");
      setNewsBody("");
      setNewsImageUrl("");
      setNewsSendNotification(false);
      setMessage("Новость добавлена.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось добавить новость.");
    } finally {
      setNewsSaving(false);
    }
  };

  const handleUploadNewsImage = async (file: File | null, mode: "create" | "edit") => {
    if (!team || !currentUser?.id || !file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Нужен файл изображения.");
      return;
    }

    setNewsImageUploading(true);
    setError(null);
    setMessage(null);
    try {
      const uploadedImageUrl = await uploadTeamNewsImage(team.id, file, currentUser.id);
      if (mode === "create") {
        setNewsImageUrl(uploadedImageUrl);
      } else {
        setEditingNewsImageUrl(uploadedImageUrl);
      }
      setMessage("Изображение новости загружено.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить изображение новости.");
    } finally {
      setNewsImageUploading(false);
    }
  };

  const startEditNews = (item: TeamNewsDto) => {
    setEditingNewsId(item.id);
    setEditingNewsTitle(item.title);
    setEditingNewsBody(item.body);
    setEditingNewsImageUrl(item.imageUrl ?? "");
    setError(null);
    setMessage(null);
  };

  const cancelEditNews = () => {
    setEditingNewsId(null);
    setEditingNewsTitle("");
    setEditingNewsBody("");
    setEditingNewsImageUrl("");
  };

  const handleUpdateNews = async (item: TeamNewsDto) => {
    if (!team || !currentUser?.id) {
      return;
    }

    if (!editingNewsTitle.trim() || !editingNewsBody.trim()) {
      setError("У новости должны быть название и текст.");
      return;
    }

    setNewsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateTeamNews(team.id, item.id, { title: editingNewsTitle.trim(), body: editingNewsBody.trim(), imageUrl: editingNewsImageUrl.trim() || null }, currentUser.id);
      setNews((previous) => previous.map((value) => value.id === item.id ? updated : value));
      cancelEditNews();
      setMessage("Новость обновлена.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось обновить новость.");
    } finally {
      setNewsSaving(false);
    }
  };

  const handleDeleteNews = async (item: TeamNewsDto) => {
    if (!team || !currentUser?.id) {
      return;
    }

    if (!window.confirm("Удалить эту новость?")) {
      return;
    }

    setNewsDeletingId(item.id);
    setError(null);
    setMessage(null);
    try {
      await deleteTeamNews(team.id, item.id, currentUser.id);
      setNews((previous) => previous.filter((value) => value.id !== item.id));
      setMessage("Новость удалена.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось удалить новость.");
    } finally {
      setNewsDeletingId(null);
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
      {...teamTabsSwipeHandlers}
      style={{
        minHeight: "100vh",
        padding: "16px",
        paddingBottom: "32px",
        background: "linear-gradient(135deg, var(--hp-surface-soft) 0%, var(--hp-info-soft) 100%)",
        boxSizing: "border-box",
      }}
    >
      <main style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button
            onClick={() => navigate("/teams")}
            style={{ borderRadius: 12, border: "1px solid var(--hp-border)", background: "var(--hp-surface)", width: 42, height: 42, cursor: "pointer", fontSize: 20 }}
            aria-label="Назад"
          >
            ←
          </button>
        </div>

        {error && <div style={{ marginBottom: 12, background: "var(--hp-danger-soft)", color: "var(--hp-danger)", borderRadius: 14, padding: "12px 14px" }}>{error}</div>}
        {message && <div style={{ marginBottom: 12, background: "var(--hp-success-soft)", color: "var(--hp-success)", borderRadius: 14, padding: "12px 14px", fontWeight: 800 }}>{message}</div>}

        {loading && <section style={cardStyle}><LoadingIndicator text="Загружаем команду..." /></section>}

        {!loading && team && (
          <>
            <section style={{ ...cardStyle, overflow: "visible", padding: 0 }}>
              <div
                style={{
                  height: 96,
                  borderRadius: "16px 16px 0 0",
                  background: team.coverImageUrl
                    ? `linear-gradient(rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.08)), url(${team.coverImageUrl}) center/cover`
                    : "linear-gradient(135deg, #0f766e 0%, var(--hp-primary) 55%, #7c3aed 100%)",
                }}
              />
              <div style={{ padding: "0 16px 16px" }}>
                <div
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: 24,
                    background: team.avatarUrl ? `url(${team.avatarUrl}) center/cover` : "var(--hp-surface)",
                    border: "4px solid var(--hp-surface)",
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
                    <h2 style={{ margin: "0 0 6px", fontSize: 30, color: "var(--hp-text-strong)", lineHeight: 1.05 }}>{team.name}</h2>
                    <div style={{ color: "var(--hp-muted)", fontWeight: 800 }}>
                      {getVisibilityText(team.visibility)} · участников: {team.membersCount}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", flexShrink: 0 }}>
                    <div style={{ borderRadius: 999, padding: "7px 10px", background: "var(--hp-neutral-soft)", color: "var(--hp-neutral)", fontSize: 13, fontWeight: 900, whiteSpace: "nowrap" }}>
                      {getRoleText(team.myRole)}
                    </div>
                    {(teamPwaInstall.canOfferInstall || (team.myRole && team.myRole !== TeamRole.Owner)) && (
                      <>
                        <button
                          type="button"
                          aria-label="Меню команды"
                          onClick={() => setIsTeamMenuOpen((value) => !value)}
                          style={{ width: 34, height: 34, borderRadius: 12, border: "1px solid var(--hp-border)", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontSize: 20, lineHeight: 1, fontWeight: 900, cursor: "pointer" }}
                        >
                          ...
                        </button>
                        {isTeamMenuOpen && (
                          <div
                            style={{
                              position: "absolute",
                              top: 40,
                              right: 0,
                              zIndex: 10,
                              width: 250,
                              border: "1px solid var(--hp-border)",
                              borderRadius: 14,
                              background: "var(--hp-surface)",
                              boxShadow: "var(--hp-shadow-md)",
                              padding: 8,
                              display: "grid",
                              gap: 8,
                            }}
                          >
                            {teamPwaInstall.canOfferInstall && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsTeamMenuOpen(false);
                                  setIsTeamInstallDialogOpen(true);
                                }}
                                disabled={teamPwaInstall.isPreparing}
                                style={{
                                  width: "100%",
                                  border: "1px solid var(--hp-primary)",
                                  borderRadius: 12,
                                  padding: "10px 12px",
                                  background: "var(--hp-primary-soft)",
                                  color: "var(--hp-primary)",
                                  fontWeight: 900,
                                  cursor: teamPwaInstall.isPreparing ? "wait" : "pointer",
                                  textAlign: "left",
                                  opacity: teamPwaInstall.isPreparing ? 0.7 : 1,
                                }}
                              >
                                {teamPwaInstall.isPreparing ? "Готовим иконку..." : "Установить приложение команды"}
                              </button>
                            )}
                            {confirmLeave && (
                              <div style={{ borderRadius: 12, padding: 10, background: "var(--hp-warning-soft)", color: "var(--hp-warning)", border: "1px solid var(--hp-warning-border)", fontWeight: 800, lineHeight: 1.35, fontSize: 13 }}>
                                Подтвердите выход из команды.
                              </div>
                            )}
                            {team.myRole && team.myRole !== TeamRole.Owner && (
                              <button
                                type="button"
                                onClick={handleLeave}
                                disabled={leaving}
                                style={{ width: "100%", border: "1px solid var(--hp-danger-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 900, cursor: leaving ? "wait" : "pointer", textAlign: "left" }}
                              >
                                {leaving ? "Выходим..." : confirmLeave ? "Да, покинуть" : "Покинуть команду"}
                              </button>
                            )}
                            {team.myRole && team.myRole !== TeamRole.Owner && confirmLeave && (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmLeave(false);
                                  setIsTeamMenuOpen(false);
                                }}
                                style={{ width: "100%", border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer", textAlign: "left" }}
                              >
                                Отмена
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {team.myBadgeTitle && (
                  <div style={{ display: "inline-flex", marginTop: 10, borderRadius: 999, padding: "6px 10px", background: "var(--hp-info-soft)", color: "var(--hp-info)", fontWeight: 900 }}>
                    {team.myBadgeTitle}
                  </div>
                )}

                {(team.description || hasContacts) && (
                  <div style={{ marginTop: 12 }}>
                    {team.description && (
                      <p style={{ margin: 0, color: "var(--hp-muted)", lineHeight: 1.45 }}>
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
                        style={{ border: 0, background: "transparent", padding: "6px 0 0", color: "var(--hp-primary)", fontWeight: 900, cursor: "pointer" }}
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
                      style={{ border: 0, borderRadius: 14, padding: "12px 10px", background: isMainTeam ? "var(--hp-success-soft)" : "var(--hp-primary-soft)", color: isMainTeam ? "var(--hp-success)" : "var(--hp-primary-text)", fontWeight: 900, cursor: isMainTeam ? "default" : "pointer" }}
                    >
                      {isMainTeam ? "Основная" : "Сделать основной"}
                    </button>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => navigate(`/teams/${team.id}/manage`)}
                      style={{ border: "1px solid var(--hp-border)", borderRadius: 14, padding: "12px 10px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}
                    >
                      Настройки
                    </button>
                  )}
                </div>

                {canJoinPublic && (
                  <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                    {confirmJoin && (
                      <div style={{ borderRadius: 14, padding: 12, background: "var(--hp-warning-soft)", color: "var(--hp-warning)", border: "1px solid var(--hp-warning-border)", fontWeight: 800, lineHeight: 1.4 }}>
                        Подтвердите вступление. После этого команда появится в ваших командах и в фильтрах мероприятий.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={joining}
                      style={{ border: 0, borderRadius: 14, padding: "13px 14px", background: confirmJoin ? "var(--hp-success)" : "var(--hp-primary)", color: "white", fontWeight: 900, cursor: joining ? "wait" : "pointer", opacity: joining ? 0.72 : 1 }}
                    >
                      {joining ? "Вступаем..." : confirmJoin ? "Да, вступить в команду" : "Вступить в команду"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section style={{ ...cardStyle, marginTop: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, padding: 5, borderRadius: 16, background: "var(--hp-surface-muted)", marginBottom: 12 }}>
                {([
                  ["news", "Новости"],
                  ["tables", "Таблицы"],
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
                      padding: "9px 2px",
                      background: activeTab === tab ? "var(--hp-surface)" : "transparent",
                      color: activeTab === tab ? "var(--hp-text-strong)" : "var(--hp-muted)",
                      fontSize: 11,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      letterSpacing: 0,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      boxShadow: activeTab === tab ? "var(--hp-shadow-sm)" : "none",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "news" && (
                <div style={{ display: "grid", gap: 10 }}>
                  {canManage && (
                    <div style={{ border: "1px solid var(--hp-info-border)", borderRadius: 16, padding: 12, background: "var(--hp-info-soft)", display: "grid", gap: 8 }}>
                      <input
                        value={newsTitle}
                        onChange={(event) => setNewsTitle(event.target.value)}
                        placeholder="Название новости"
                        maxLength={120}
                        style={{ border: "1px solid var(--hp-info-border)", borderRadius: 12, padding: "10px 12px", fontWeight: 800 }}
                      />
                      <textarea
                        value={newsBody}
                        onChange={(event) => setNewsBody(event.target.value)}
                        placeholder="Текст новости"
                        maxLength={2000}
                        style={{ border: "1px solid var(--hp-info-border)", borderRadius: 12, padding: "10px 12px", minHeight: 82, resize: "vertical", fontFamily: "inherit" }}
                      />
                      {newsImageUrl && (
                        <button type="button" onClick={() => setPreviewImageUrl(newsImageUrl)} style={{ border: 0, padding: 0, background: "transparent", cursor: "zoom-in", textAlign: "left" }}>
                          <img src={newsImageUrl} alt="" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--hp-info-border)", maxHeight: 260, objectFit: "cover", background: "var(--hp-surface)", display: "block" }} />
                        </button>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: newsImageUrl ? "1fr auto" : "1fr", gap: 8 }}>
                        <label style={{ border: "1px solid var(--hp-info-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface)", color: "var(--hp-heading)", fontWeight: 900, cursor: newsImageUploading ? "wait" : "pointer", textAlign: "center", opacity: newsImageUploading ? 0.7 : 1 }}>
                          {newsImageUploading ? "Загружаем..." : newsImageUrl ? "Заменить картинку" : "Прикрепить картинку"}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={newsImageUploading}
                            onChange={(event) => {
                              void handleUploadNewsImage(event.target.files?.[0] ?? null, "create");
                              event.currentTarget.value = "";
                            }}
                            style={{ display: "none" }}
                          />
                        </label>
                        {newsImageUrl && (
                          <button type="button" onClick={() => setNewsImageUrl("")} style={{ border: "1px solid var(--hp-danger-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 900, cursor: "pointer" }}>
                            Убрать
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewsSendNotification((value) => !value)}
                        aria-pressed={newsSendNotification}
                        style={{
                          border: "1px solid var(--hp-info-border)",
                          borderRadius: 12,
                          padding: "10px 12px",
                          background: "var(--hp-surface)",
                          color: "var(--hp-heading)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span>Отправить уведомление</span>
                        <span
                          aria-hidden="true"
                          style={{
                            width: 46,
                            height: 26,
                            borderRadius: 999,
                            padding: 2,
                            border: newsSendNotification ? "1px solid var(--hp-primary)" : "1px solid var(--hp-border)",
                            background: newsSendNotification ? "var(--hp-primary)" : "var(--hp-surface-soft)",
                            boxSizing: "border-box",
                            flexShrink: 0,
                            transition: "all 0.18s ease",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: newsSendNotification ? "white" : "var(--hp-muted)",
                              transform: newsSendNotification ? "translateX(20px)" : "translateX(0)",
                              transition: "all 0.18s ease",
                              boxShadow: "var(--hp-shadow-sm)",
                            }}
                          />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCreateNews()}
                        disabled={newsSaving}
                        style={{ border: 0, borderRadius: 12, padding: "11px 12px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: newsSaving ? "wait" : "pointer", opacity: newsSaving ? 0.7 : 1 }}
                      >
                        {newsSaving ? "Публикуем..." : "Добавить новость"}
                      </button>
                    </div>
                  )}

                  {newsLoading && <LoadingIndicator text="Загружаем новости..." />}
                  {!newsLoading && news.length === 0 && (
                    <div style={{ border: "1px dashed var(--hp-border)", borderRadius: 16, padding: 16, color: "var(--hp-muted)", lineHeight: 1.45, background: "var(--hp-surface-soft)" }}>
                      <div style={{ fontWeight: 900, color: "var(--hp-text-strong)", marginBottom: 6 }}>Новостей пока нет</div>
                      Здесь будут объявления команды, важные предупреждения и посты капитана или тренера.
                    </div>
                  )}
                  {!newsLoading &&
                    news.map((item) => (
                      <article key={item.id} style={{ border: "1px solid var(--hp-border)", borderRadius: 16, padding: 14, background: "var(--hp-surface)" }}>
                        {editingNewsId === item.id ? (
                          <div style={{ display: "grid", gap: 8 }}>
                            <input
                              value={editingNewsTitle}
                              onChange={(event) => setEditingNewsTitle(event.target.value)}
                              maxLength={120}
                              style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-input-bg)", color: "var(--hp-text)", fontWeight: 800 }}
                            />
                            <textarea
                              value={editingNewsBody}
                              onChange={(event) => setEditingNewsBody(event.target.value)}
                              maxLength={2000}
                              style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", minHeight: 96, resize: "vertical", fontFamily: "inherit", background: "var(--hp-input-bg)", color: "var(--hp-text)" }}
                            />
                            {editingNewsImageUrl && (
                              <button type="button" onClick={() => setPreviewImageUrl(editingNewsImageUrl)} style={{ border: 0, padding: 0, background: "transparent", cursor: "zoom-in", textAlign: "left" }}>
                                <img src={editingNewsImageUrl} alt="" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--hp-border)", maxHeight: 260, objectFit: "cover", background: "var(--hp-surface-soft)", display: "block" }} />
                              </button>
                            )}
                            <div style={{ display: "grid", gridTemplateColumns: editingNewsImageUrl ? "1fr auto" : "1fr", gap: 8 }}>
                              <label style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: newsImageUploading ? "wait" : "pointer", textAlign: "center", opacity: newsImageUploading ? 0.7 : 1 }}>
                                {newsImageUploading ? "Загружаем..." : editingNewsImageUrl ? "Заменить картинку" : "Прикрепить картинку"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={newsImageUploading}
                                  onChange={(event) => {
                                    void handleUploadNewsImage(event.target.files?.[0] ?? null, "edit");
                                    event.currentTarget.value = "";
                                  }}
                                  style={{ display: "none" }}
                                />
                              </label>
                              {editingNewsImageUrl && (
                                <button type="button" onClick={() => setEditingNewsImageUrl("")} style={{ border: "1px solid var(--hp-danger-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 900, cursor: "pointer" }}>
                                  Убрать
                                </button>
                              )}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <button type="button" onClick={cancelEditNews} style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}>
                                Отмена
                              </button>
                              <button type="button" onClick={() => void handleUpdateNews(item)} disabled={newsSaving} style={{ border: 0, borderRadius: 12, padding: "10px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: newsSaving ? "wait" : "pointer", opacity: newsSaving ? 0.7 : 1 }}>
                                {newsSaving ? "Сохраняем..." : "Сохранить"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                              <div style={{ minWidth: 0 }}>
                                <h3 style={{ margin: "0 0 7px", color: "var(--hp-text-strong)", fontSize: 17 }}>{item.title}</h3>
                                <div style={{ color: "var(--hp-muted)", fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
                                  {item.authorName || "Команда"} · {formatNewsDate(item.createdAt)}
                                  {item.updatedAt && item.updatedAt !== item.createdAt ? " · изменено" : ""}
                                </div>
                              </div>
                              {canManage && (
                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                  <button type="button" onClick={() => startEditNews(item)} style={{ border: "1px solid var(--hp-border)", borderRadius: 10, padding: "7px 9px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}>
                                    ✎
                                  </button>
                                  <button type="button" onClick={() => void handleDeleteNews(item)} disabled={newsDeletingId === item.id} style={{ border: "1px solid var(--hp-danger-border)", borderRadius: 10, padding: "7px 9px", background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 900, cursor: newsDeletingId === item.id ? "wait" : "pointer", opacity: newsDeletingId === item.id ? 0.7 : 1 }}>
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                            {item.imageUrl && (
                              <button type="button" onClick={() => setPreviewImageUrl(item.imageUrl ?? null)} style={{ border: 0, padding: 0, margin: "0 0 10px", background: "transparent", cursor: "zoom-in", width: "100%", textAlign: "left" }}>
                                <img src={item.imageUrl} alt="" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--hp-border)", maxHeight: 320, objectFit: "cover", background: "var(--hp-surface-soft)", display: "block" }} />
                              </button>
                            )}
                            <div style={{ color: "var(--hp-muted)", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{item.body}</div>
                          </>
                        )}
                      </article>
                    ))}
                </div>
              )}

              {activeTab === "tables" && (
                <TeamTablesPanel
                  currentUserId={currentUser?.id}
                  teamId={team.id}
                  canManageTeam={canManage}
                />
              )}

              {activeTab === "members" && (
                <div style={{ display: "grid", gap: 8 }}>
                  {membersLoading && <LoadingIndicator text="Загружаем участников..." />}
                  {!membersLoading && sortedMembers.length === 0 && <div style={{ color: "var(--hp-muted)" }}>Участников пока нет.</div>}
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
                          border: "1px solid var(--hp-border)",
                          borderRadius: 14,
                          padding: "10px 12px",
                          background: "var(--hp-surface)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = "var(--hp-surface)";
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
                            fallbackBg="var(--hp-success-soft)"
                            fallbackColor="var(--hp-heading)"
                          />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 900,
                                color: "var(--hp-heading)",
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
                            {member.badgeTitle && <div style={{ color: "var(--hp-info)", fontSize: 13, fontWeight: 900, marginTop: 2 }}>{member.badgeTitle}</div>}
                          </div>
                        </div>
                        <div style={{ color: "var(--hp-primary)", fontWeight: 900, flexShrink: 0 }}>→</div>
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
                      style={{ border: 0, borderRadius: 14, padding: "12px 14px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: "pointer" }}
                    >
                      + Добавить мероприятие
                    </button>
                  )}
                  {eventsLoading && <LoadingIndicator text="Загружаем мероприятия..." />}
                  {!eventsLoading && sortedEvents.length === 0 && <div style={{ color: "var(--hp-muted)" }}>Мероприятий этой команды пока нет.</div>}
                  {!eventsLoading && sortedEvents.map((event) => <TeamEventCard key={event.id} event={event} onOpen={(eventId) => navigate(`/events/${eventId}`)} />)}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {isTeamInstallDialogOpen && team && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="team-pwa-install-title"
          onClick={() => setIsTeamInstallDialogOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "rgba(15, 23, 42, 0.58)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "16px 12px 0",
            boxSizing: "border-box",
          }}
        >
          <div
            ref={installSheetRef}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid var(--hp-border)",
              borderBottom: 0,
              borderRadius: "22px 22px 0 0",
              background: "var(--hp-surface)",
              boxShadow: "0 -20px 60px rgba(15, 23, 42, 0.28)",
              padding: "12px 16px calc(20px + env(safe-area-inset-bottom))",
              boxSizing: "border-box",
            }}
          >
            <div {...installSheetHandleProps}>
              <div style={{ width: 42, height: 4, borderRadius: 999, background: "var(--hp-border)" }} />
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h2 id="team-pwa-install-title" style={{ margin: 0, color: "var(--hp-heading)", fontSize: 20 }}>
                  Установка приложения
                </h2>
                <div style={{ marginTop: 4, color: "var(--hp-muted)", fontSize: 13, lineHeight: 1.4 }}>
                  Настройте ярлык команды на устройстве.
                </div>
              </div>
              <button
                type="button"
                aria-label="Закрыть"
                onClick={() => setIsTeamInstallDialogOpen(false)}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--hp-border)", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontSize: 22, lineHeight: 1, cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
              <img
                src={team.avatarUrl ?? ""}
                alt=""
                style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 16, border: "1px solid var(--hp-border)", background: "white", padding: 6, boxSizing: "border-box", flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "var(--hp-muted)", fontSize: 12, fontWeight: 800 }}>Ярлык на устройстве</div>
                <div style={{ color: "var(--hp-heading)", fontSize: 16, fontWeight: 900, overflowWrap: "anywhere", marginTop: 3 }}>
                  {teamAppName.trim() || team.name}
                </div>
              </div>
            </div>

            <label style={{ display: "grid", gap: 7, color: "var(--hp-heading)", fontSize: 13, fontWeight: 900 }}>
              Название приложения
              <input
                value={teamAppName}
                maxLength={50}
                onChange={(event) => setTeamAppName(event.target.value)}
                placeholder={team.name}
                style={{ width: "100%", border: "1px solid var(--hp-border)", borderRadius: 12, padding: "12px 13px", background: "var(--hp-input-bg)", color: "var(--hp-text)", fontSize: 16, boxSizing: "border-box", outline: "none" }}
              />
            </label>

            <div style={{ marginTop: 16 }}>
              <div style={{ color: "var(--hp-heading)", fontSize: 13, fontWeight: 900, marginBottom: 7 }}>Открывать при запуске</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {([
                  ["team", "Команда"],
                  ["events", "Мероприятия"],
                  ["news", "Новости"],
                ] as Array<[TeamPwaStartPage, string]>).map(([value, label]) => {
                  const selected = teamAppStartPage === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTeamAppStartPage(value)}
                      style={{
                        border: `1px solid ${selected ? "var(--hp-primary)" : "var(--hp-border)"}`,
                        borderRadius: 12,
                        padding: "11px 10px",
                        background: selected ? "var(--hp-primary-soft)" : "var(--hp-surface-soft)",
                        color: selected ? "var(--hp-primary)" : "var(--hp-text)",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: 8, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setIsTeamInstallDialogOpen(false)}
                style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: 13, background: "var(--hp-surface-soft)", color: "var(--hp-text)", fontWeight: 900, cursor: "pointer" }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void handleInstallTeamApp()}
                disabled={teamPwaInstall.isPreparing || !teamAppName.trim()}
                style={{ border: 0, borderRadius: 12, padding: 13, background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: teamPwaInstall.isPreparing ? "wait" : "pointer", opacity: teamPwaInstall.isPreparing || !teamAppName.trim() ? 0.65 : 1 }}
              >
                {teamPwaInstall.isPreparing ? "Подготавливаем..." : "Установить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImageUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.86)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setPreviewImageUrl(null)}
            style={{
              position: "fixed",
              top: 14,
              right: 14,
              width: 42,
              height: 42,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(15, 23, 42, 0.68)",
              color: "white",
              fontSize: 24,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
          <img
            src={previewImageUrl}
            alt=""
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "92vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}
          />
        </div>
      )}

      <PlayerInfoModal player={playerModal.selectedPlayer} isOpen={playerModal.isPlayerModalOpen} onClose={playerModal.handleCloseModal} />
    </div>
  );
}

export default TeamDetailsPage;
