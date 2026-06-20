import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents } from "src/api/events";
import { getMyTeams, getNewsFeed, getPublicTeams } from "src/api/teams";
import { EventLookUpDto, EventType } from "src/types/events";
import { TeamDto, TeamNewsDto } from "src/types/teams";

interface GlobalSearchDialogProps {
  isOpen: boolean;
  currentUserId: string | null;
  onClose: () => void;
}

interface SearchCorpus {
  events: EventLookUpDto[];
  teams: TeamDto[];
  news: TeamNewsDto[];
}

interface SearchResult {
  id: string;
  icon: string;
  category: string;
  title: string;
  subtitle: string;
  url: string;
}

const emptyCorpus: SearchCorpus = { events: [], teams: [], news: [] };
const corpusCache = new Map<string, { data: SearchCorpus; loadedAt: number }>();
const CACHE_TTL_MS = 60_000;

const normalizeSearchText = (value: string): string =>
  value.trim().toLocaleLowerCase("ru-RU").replaceAll("ё", "е");

const includesQuery = (query: string, ...values: Array<string | null | undefined>): boolean =>
  values.some((value) => normalizeSearchText(value ?? "").includes(query));

const getEventIcon = (type: number): string =>
  type === EventType.Game ? "🏒" : type === EventType.Practice ? "🏋️" : "📌";

const loadSearchCorpus = async (currentUserId: string): Promise<SearchCorpus> => {
  const cached = corpusCache.get(currentUserId);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const [eventsResult, myTeamsResult, publicTeamsResult, newsResult] = await Promise.allSettled([
    getEvents(currentUserId),
    getMyTeams(currentUserId),
    getPublicTeams(),
    getNewsFeed(currentUserId),
  ]);

  const teamMap = new Map<string, TeamDto>();
  if (myTeamsResult.status === "fulfilled") {
    myTeamsResult.value.forEach((team) => teamMap.set(team.id, team));
  }
  if (publicTeamsResult.status === "fulfilled") {
    publicTeamsResult.value.forEach((team) => {
      if (!teamMap.has(team.id)) teamMap.set(team.id, team);
    });
  }

  const data: SearchCorpus = {
    events: eventsResult.status === "fulfilled" ? eventsResult.value.events ?? [] : [],
    teams: Array.from(teamMap.values()),
    news: newsResult.status === "fulfilled" ? newsResult.value : [],
  };
  corpusCache.set(currentUserId, { data, loadedAt: Date.now() });
  return data;
};

const pageResults: SearchResult[] = [
  { id: "page-events", icon: "📅", category: "Раздел", title: "Мероприятия", subtitle: "Список и календарь", url: "/events" },
  { id: "page-news", icon: "📰", category: "Раздел", title: "Новости", subtitle: "Новости и таблицы команд", url: "/news" },
  { id: "page-teams", icon: "👥", category: "Раздел", title: "Команды", subtitle: "Мои и публичные команды", url: "/teams" },
  { id: "page-profile", icon: "👤", category: "Раздел", title: "Профиль", subtitle: "Данные пользователя", url: "/profile" },
  { id: "page-notifications", icon: "🔔", category: "Настройки", title: "Уведомления", subtitle: "Push и напоминания", url: "/settings/notifications" },
  { id: "page-settings", icon: "⚙️", category: "Раздел", title: "Настройки", subtitle: "Тема, помощь и обновления", url: "/settings" },
];

export function GlobalSearchDialog({ isOpen, currentUserId, onClose }: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [corpus, setCorpus] = useState<SearchCorpus>(emptyCorpus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    let active = true;
    setLoading(true);
    void loadSearchCorpus(currentUserId)
      .then((data) => {
        if (active) setCorpus(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUserId, isOpen]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const results = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return pageResults;

    const pages = pageResults.filter((item) => includesQuery(normalizedQuery, item.title, item.subtitle, item.category));
    const events: SearchResult[] = corpus.events
      .filter((event) => includesQuery(normalizedQuery, event.title, event.description, event.teamName, event.locationName, event.locationAddress))
      .slice(0, 7)
      .map((event) => ({
        id: `event-${event.id}`,
        icon: getEventIcon(event.type),
        category: "Мероприятие",
        title: event.title || "Без названия",
        subtitle: `${new Date(event.startTime).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}${event.teamName ? ` · ${event.teamName}` : ""}`,
        url: `/events/${event.id}`,
      }));
    const teams: SearchResult[] = corpus.teams
      .filter((team) => includesQuery(normalizedQuery, team.name, team.description, ...(team.addresses ?? []).flatMap((item) => [item.title, item.value])))
      .slice(0, 6)
      .map((team) => ({
        id: `team-${team.id}`,
        icon: "🛡️",
        category: "Команда",
        title: team.name,
        subtitle: `Участников: ${team.membersCount}`,
        url: `/teams/${team.id}`,
      }));
    const news: SearchResult[] = corpus.news
      .filter((item) => includesQuery(normalizedQuery, item.title, item.body, item.teamName, item.authorName))
      .slice(0, 5)
      .map((item) => ({
        id: `news-${item.id}`,
        icon: "📰",
        category: "Новость",
        title: item.title,
        subtitle: item.teamName || "Новость команды",
        url: `/teams/${item.teamId}`,
      }));

    return [...pages, ...events, ...teams, ...news].slice(0, 20);
  }, [corpus, query]);

  if (!isOpen) return null;

  const openResult = (result: SearchResult) => {
    onClose();
    navigate(result.url);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Глобальный поиск" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15, 23, 42, 0.5)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 600, minHeight: "100%", background: "var(--hp-bg)", color: "var(--hp-text)", boxShadow: "var(--hp-shadow-md)", overflowY: "auto" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--hp-surface)", borderBottom: "1px solid var(--hp-border)" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span aria-hidden="true" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--hp-muted)", fontSize: 17 }}>⌕</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по приложению"
              aria-label="Поиск по приложению"
              style={{ width: "100%", height: 42, padding: "0 38px", border: "1px solid var(--hp-border)", borderRadius: 14, background: "var(--hp-input-bg)", color: "var(--hp-text)", fontSize: 16, boxSizing: "border-box", outline: "none" }}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Очистить поиск" style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", width: 28, height: 28, border: 0, borderRadius: 9, background: "transparent", color: "var(--hp-muted)", cursor: "pointer", fontSize: 20 }}>×</button>
            )}
          </div>
          <button type="button" onClick={onClose} style={{ border: 0, background: "transparent", color: "var(--hp-primary)", fontWeight: 800, cursor: "pointer", padding: "8px 2px" }}>Закрыть</button>
        </div>

        <div style={{ padding: "10px 12px 32px" }}>
          {!query && <div style={{ padding: "4px 4px 10px", color: "var(--hp-muted)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>Быстрый переход</div>}
          {loading && query && <div style={{ padding: 14, color: "var(--hp-muted)", textAlign: "center" }}>Ищем...</div>}
          {!loading && query && results.length === 0 && <div style={{ padding: "28px 14px", color: "var(--hp-muted)", textAlign: "center" }}>Ничего не найдено</div>}
          <div style={{ display: "grid", gap: 6 }}>
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => openResult(result)}
                style={{ width: "100%", border: "1px solid transparent", borderRadius: 13, padding: "10px", background: "var(--hp-surface)", color: "var(--hp-text)", display: "grid", gridTemplateColumns: "38px minmax(0, 1fr) auto", alignItems: "center", gap: 10, textAlign: "left", cursor: "pointer" }}
              >
                <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 12, background: "var(--hp-surface-soft)", display: "grid", placeItems: "center", fontSize: 19 }}>{result.icon}</span>
                <span style={{ minWidth: 0, display: "grid", gap: 3 }}>
                  <span style={{ color: "var(--hp-heading)", fontSize: 14, fontWeight: 850, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{result.title}</span>
                  <span style={{ color: "var(--hp-muted)", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{result.category} · {result.subtitle}</span>
                </span>
                <span aria-hidden="true" style={{ color: "var(--hp-muted)", fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
