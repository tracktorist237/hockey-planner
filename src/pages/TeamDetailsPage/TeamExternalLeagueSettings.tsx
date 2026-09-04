import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  createTeamExternalLeagueLink,
  deleteTeamExternalLeagueLink,
  ExternalLeagueLink,
  ExternalLeagueProvider,
  ExternalLeagueSyncResult,
  ExternalTeamSearchItem,
  getTeamExternalLeagueLinks,
  searchExternalLeagueTeams,
  syncAllTeamExternalLeagueLinks,
  syncTeamExternalLeagueLink,
} from "src/api/externalLeagueTeams";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { cardStyle, inputStyle } from "src/pages/TeamsPage/components/styles";

interface TeamExternalLeagueSettingsProps {
  teamId: string;
}

type BusyOperation = "search" | "add" | "primary" | "sync" | "sync-all" | "remove";

const providerOptions = [
  { value: ExternalLeagueProvider.Spbhl, label: "СПбХЛ" },
];

const providerLabel = (provider: ExternalLeagueProvider) =>
  providerOptions.find((option) => option.value === provider)?.label ?? "Внешняя лига";

const buttonStyle = {
  border: 0,
  borderRadius: 8,
  padding: "10px 12px",
  background: "var(--hp-primary)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  flex: "1 1 150px",
} as const;

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "var(--hp-primary-soft)",
  color: "var(--hp-primary)",
};

const formatTimestamp = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const SyncSummary = ({ result }: { result: ExternalLeagueSyncResult }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 6, fontSize: 13 }}>
    <span>Получено: <strong>{result.receivedCount}</strong></span>
    <span>Добавлено: <strong>{result.createdCount}</strong></span>
    <span>Обновлено: <strong>{result.updatedCount}</strong></span>
    <span>Без изменений: <strong>{result.unchangedCount}</strong></span>
  </div>
);

export function TeamExternalLeagueSettings({ teamId }: TeamExternalLeagueSettingsProps) {
  const [provider, setProvider] = useState(ExternalLeagueProvider.Spbhl);
  const [links, setLinks] = useState<ExternalLeagueLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<BusyOperation | null>(null);
  const [title, setTitle] = useState("");
  const [results, setResults] = useState<ExternalTeamSearchItem[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ExternalLeagueSyncResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const operationLocked = useRef(false);
  const operationGeneration = useRef(0);
  const loadGeneration = useRef(0);
  const searchGeneration = useRef(0);
  const activeTeamId = useRef(teamId);
  const mounted = useRef(true);

  const loadLinks = useCallback(async () => {
    const generation = ++loadGeneration.current;
    const requestedTeamId = teamId;
    setLoading(true);
    setError(null);
    try {
      const nextLinks = await getTeamExternalLeagueLinks(teamId);
      if (mounted.current && generation === loadGeneration.current && requestedTeamId === activeTeamId.current) {
        setLinks(nextLinks);
      }
    } catch (requestError) {
      if (mounted.current && generation === loadGeneration.current && requestedTeamId === activeTeamId.current) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить внешние профили.");
      }
    } finally {
      if (mounted.current && generation === loadGeneration.current && requestedTeamId === activeTeamId.current) {
        setLoading(false);
      }
    }
  }, [teamId]);

  useEffect(() => {
    mounted.current = true;
    activeTeamId.current = teamId;
    operationLocked.current = false;
    operationGeneration.current += 1;
    loadGeneration.current += 1;
    searchGeneration.current += 1;
    setLinks([]);
    setBusy(null);
    setTitle("");
    setResults([]);
    setSummaries({});
    setError(null);
    setMessage(null);
    void loadLinks();
    return () => {
      mounted.current = false;
      operationGeneration.current += 1;
      loadGeneration.current += 1;
      searchGeneration.current += 1;
    };
  }, [loadLinks, teamId]);

  const beginOperation = (operation: BusyOperation): number | null => {
    if (operationLocked.current) return null;
    operationLocked.current = true;
    setBusy(operation);
    setError(null);
    setMessage(null);
    return ++operationGeneration.current;
  };

  const isCurrentOperation = (generation: number, requestedTeamId: string) =>
    mounted.current &&
    generation === operationGeneration.current &&
    requestedTeamId === activeTeamId.current;

  const finishOperation = (generation: number, requestedTeamId: string) => {
    if (!isCurrentOperation(generation, requestedTeamId)) return;
    operationLocked.current = false;
    setBusy(null);
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = title.trim();
    if (normalized.length < 2 || normalized.length > 100) {
      setError("Введите от 2 до 100 символов.");
      return;
    }
    const requestedTeamId = teamId;
    const operation = beginOperation("search");
    if (operation === null) return;
    const search = ++searchGeneration.current;
    try {
      const found = await searchExternalLeagueTeams(provider, normalized);
      if (isCurrentOperation(operation, requestedTeamId) && search === searchGeneration.current) setResults(found);
    } catch (requestError) {
      if (isCurrentOperation(operation, requestedTeamId) && search === searchGeneration.current) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось найти команду.");
      }
    } finally {
      finishOperation(operation, requestedTeamId);
    }
  };

  const handleAdd = async (item: ExternalTeamSearchItem) => {
    const requestedTeamId = teamId;
    const operation = beginOperation("add");
    if (operation === null) return;
    try {
      const link = await createTeamExternalLeagueLink(teamId, {
        provider: item.provider,
        externalTeamId: item.externalTeamId,
        isPrimary: false,
      });
      if (!isCurrentOperation(operation, requestedTeamId)) return;
      setLinks((current) => [...current.filter((value) => value.id !== link.id), link]);
      setResults([]);
      setTitle("");
      setMessage(`Команда «${link.externalTeamName}» добавлена.`);
    } catch (requestError) {
      if (isCurrentOperation(operation, requestedTeamId)) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось добавить команду.");
      }
    } finally {
      finishOperation(operation, requestedTeamId);
    }
  };

  const handleMakePrimary = async (link: ExternalLeagueLink) => {
    const requestedTeamId = teamId;
    const operation = beginOperation("primary");
    if (operation === null) return;
    try {
      const primary = await createTeamExternalLeagueLink(teamId, {
        provider: link.provider,
        externalTeamId: link.externalTeamId,
        isPrimary: true,
      });
      if (!isCurrentOperation(operation, requestedTeamId)) return;
      setLinks((current) => current.map((value) => value.provider === primary.provider
        ? { ...value, isPrimary: value.id === primary.id, ...(value.id === primary.id ? primary : {}) }
        : value));
      setMessage(`«${primary.externalTeamName}» теперь основной профиль.`);
    } catch (requestError) {
      if (isCurrentOperation(operation, requestedTeamId)) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось изменить основной профиль.");
      }
    } finally {
      finishOperation(operation, requestedTeamId);
    }
  };

  const handleSync = async (link: ExternalLeagueLink) => {
    const requestedTeamId = teamId;
    const operation = beginOperation("sync");
    if (operation === null) return;
    try {
      const result = await syncTeamExternalLeagueLink(teamId, link.id);
      if (!isCurrentOperation(operation, requestedTeamId)) return;
      setSummaries((current) => ({ ...current, [link.id]: result }));
      setLinks((current) => current.map((value) => value.id === link.id
        ? { ...value, lastSyncAttemptAt: result.syncedAt, lastSuccessfulSyncAt: result.syncedAt }
        : value));
      setMessage(`Расписание «${link.externalTeamName}» обновлено.`);
    } catch (requestError) {
      if (isCurrentOperation(operation, requestedTeamId)) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось синхронизировать расписание.");
      }
    } finally {
      finishOperation(operation, requestedTeamId);
    }
  };

  const handleSyncAll = async () => {
    const requestedTeamId = teamId;
    const operation = beginOperation("sync-all");
    if (operation === null) return;
    try {
      const syncResults = await syncAllTeamExternalLeagueLinks(teamId);
      if (!isCurrentOperation(operation, requestedTeamId)) return;
      const nextSummaries = Object.fromEntries(syncResults.map((result) => [result.linkId, result]));
      setSummaries((current) => ({ ...current, ...nextSummaries }));
      setLinks((current) => current.map((link) => {
        const result = nextSummaries[link.id];
        return result ? { ...link, lastSyncAttemptAt: result.syncedAt, lastSuccessfulSyncAt: result.syncedAt } : link;
      }));
      setMessage("Расписания привязанных команд обновлены.");
    } catch (requestError) {
      if (isCurrentOperation(operation, requestedTeamId)) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось синхронизировать расписания.");
      }
    } finally {
      finishOperation(operation, requestedTeamId);
    }
  };

  const handleRemove = async (link: ExternalLeagueLink) => {
    if (!window.confirm(`Удалить привязку «${link.externalTeamName}»?\n\nРанее импортированные матчи останутся в HockeyPlanner.`)) return;
    const requestedTeamId = teamId;
    const operation = beginOperation("remove");
    if (operation === null) return;
    try {
      await deleteTeamExternalLeagueLink(teamId, link.id);
      if (!isCurrentOperation(operation, requestedTeamId)) return;
      setLinks((current) => current.filter((value) => value.id !== link.id));
      setSummaries((current) => {
        const next = { ...current };
        delete next[link.id];
        return next;
      });
      setMessage(`Привязка «${link.externalTeamName}» удалена.`);
    } catch (requestError) {
      if (isCurrentOperation(operation, requestedTeamId)) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось удалить привязку.");
      }
    } finally {
      finishOperation(operation, requestedTeamId);
    }
  };

  return (
    <section style={{ ...cardStyle, marginTop: 14, display: "grid", gap: 14 }}>
      <div>
        <h2 style={{ margin: "0 0 5px", fontSize: 20, color: "var(--hp-text-strong)" }}>Лига и официальный профиль</h2>
        <p style={{ margin: 0, color: "var(--hp-muted)", fontSize: 14, lineHeight: 1.45 }}>
          Привяжите официальные профили команд, чтобы загружать расписание, переносы и результаты.
        </p>
      </div>

      <label style={{ display: "grid", gap: 6, color: "var(--hp-muted)", fontSize: 13, fontWeight: 800 }}>
        Лига
        <select
          aria-label="Лига"
          value={provider}
          onChange={(event) => {
            setProvider(Number(event.target.value) as ExternalLeagueProvider);
            setResults([]);
            setTitle("");
          }}
          disabled={busy !== null}
          style={inputStyle}
        >
          {providerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>

      {error && <div role="alert" style={{ padding: 10, borderRadius: 8, background: "var(--hp-danger-soft)", color: "var(--hp-danger)" }}>{error}</div>}
      {message && <div role="status" style={{ padding: 10, borderRadius: 8, background: "var(--hp-success-soft)", color: "var(--hp-success)" }}>{message}</div>}

      {loading && links.length === 0 ? <LoadingIndicator text="Загружаем официальные профили..." /> : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 17, color: "var(--hp-heading)" }}>Привязанные команды</h3>
            {links.length > 0 && (
              <button type="button" onClick={() => void handleSyncAll()} disabled={busy !== null} style={{ ...secondaryButtonStyle, flex: "0 1 auto" }}>
                {busy === "sync-all" ? "Синхронизируем..." : "Синхронизировать все"}
              </button>
            )}
          </div>

          {links.length === 0 && <div style={{ color: "var(--hp-muted)", fontSize: 14 }}>Официальные профили пока не привязаны.</div>}
          <div style={{ display: "grid", gap: 10 }}>
            {links.map((link) => (
              <article key={link.id} data-testid={`external-link-${link.id}`} style={{ border: "1px solid var(--hp-border)", borderRadius: 8, padding: 12, display: "grid", gap: 10, minWidth: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: link.logoUrl ? "52px minmax(0, 1fr)" : "minmax(0, 1fr)", gap: 12, alignItems: "center" }}>
                  {link.logoUrl && <img src={link.logoUrl} alt="" width={52} height={52} style={{ objectFit: "contain", maxWidth: "100%" }} />}
                  <div style={{ minWidth: 0, display: "grid", gap: 4 }}>
                    <strong style={{ color: "var(--hp-heading)", overflowWrap: "anywhere" }}>{link.externalTeamName}</strong>
                    <span style={{ color: "var(--hp-muted)", fontSize: 13 }}>
                      {[providerLabel(link.provider), link.divisionName].filter(Boolean).join(" · ")}
                    </span>
                    {link.isPrimary && <span style={{ color: "var(--hp-success)", fontSize: 13, fontWeight: 800 }}>Основной профиль</span>}
                    <span style={{ color: "var(--hp-muted)", fontSize: 13 }}>
                      {link.lastSuccessfulSyncAt ? `Последняя синхронизация: ${formatTimestamp(link.lastSuccessfulSyncAt)}` : "Расписание ещё не синхронизировалось"}
                    </span>
                  </div>
                </div>
                {summaries[link.id] && <SyncSummary result={summaries[link.id]} />}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {link.profileUrl && <a href={link.profileUrl} target="_blank" rel="noopener noreferrer" style={{ ...secondaryButtonStyle, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>Открыть</a>}
                  <button type="button" onClick={() => void handleSync(link)} disabled={busy !== null} style={buttonStyle}>Синхронизировать</button>
                  {!link.isPrimary && <button type="button" onClick={() => void handleMakePrimary(link)} disabled={busy !== null} style={secondaryButtonStyle}>Сделать основным</button>}
                  <button type="button" onClick={() => void handleRemove(link)} disabled={busy !== null} style={{ ...secondaryButtonStyle, background: "var(--hp-danger-soft)", color: "var(--hp-danger)" }}>Удалить</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <details>
        <summary style={{ cursor: "pointer", color: "var(--hp-primary)", fontWeight: 800 }}>+ Добавить команду</summary>
        <form onSubmit={(event) => void handleSearch(event)} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="Название команды" style={{ ...inputStyle, minWidth: 0, flex: "1 1 180px" }} />
          <button type="submit" disabled={busy !== null} style={buttonStyle}>{busy === "search" ? "Ищем..." : "Найти команду"}</button>
        </form>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {results.map((item) => (
            <article key={`${item.provider}:${item.externalTeamId}`} style={{ border: "1px solid var(--hp-border)", borderRadius: 8, padding: 12, display: "grid", gridTemplateColumns: item.logoUrl ? "52px minmax(0, 1fr)" : "minmax(0, 1fr)", gap: 12 }}>
              {item.logoUrl && <img src={item.logoUrl} alt="" width={52} height={52} style={{ objectFit: "contain", maxWidth: "100%" }} />}
              <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
                <strong style={{ color: "var(--hp-heading)", overflowWrap: "anywhere" }}>{item.name}</strong>
                {(item.city || item.country) && <span style={{ color: "var(--hp-muted)", fontSize: 13 }}>{[item.city, item.country].filter(Boolean).join(", ")}</span>}
                {item.divisionName && <span style={{ color: "var(--hp-muted)", fontSize: 13 }}>{item.divisionName}</span>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {item.profileUrl && <a href={item.profileUrl} target="_blank" rel="noopener noreferrer" style={{ ...secondaryButtonStyle, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>Открыть</a>}
                  <button type="button" onClick={() => void handleAdd(item)} disabled={busy !== null} style={buttonStyle}>Добавить</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
