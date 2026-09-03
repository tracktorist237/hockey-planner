import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import {
  bindTeamSpbhl,
  getTeamSpbhlStatus,
  searchSpbhlTeams,
  SpbhlTeamLinkStatus,
  SpbhlTeamSearchItem,
  SpbhlTeamSyncResult,
  syncTeamSpbhlNow,
  unbindTeamSpbhl,
} from "src/api/teamSpbhl";
import { cardStyle, inputStyle } from "src/pages/TeamsPage/components/styles";

interface TeamSpbhlSettingsProps {
  teamId: string;
}

type BusyOperation = "search" | "bind" | "sync" | "unbind";

const buttonStyle = {
  border: 0,
  borderRadius: 12,
  padding: "11px 14px",
  background: "var(--hp-primary)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
} as const;

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

const SyncSummary = ({ result }: { result: SpbhlTeamSyncResult }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, fontSize: 13 }}>
    <span>Получено: <strong>{result.receivedCount}</strong></span>
    <span>Добавлено: <strong>{result.createdCount}</strong></span>
    <span>Обновлено: <strong>{result.updatedCount}</strong></span>
    <span>Без изменений: <strong>{result.unchangedCount}</strong></span>
  </div>
);

export function TeamSpbhlSettings({ teamId }: TeamSpbhlSettingsProps) {
  const [status, setStatus] = useState<SpbhlTeamLinkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<BusyOperation | null>(null);
  const [title, setTitle] = useState("");
  const [results, setResults] = useState<SpbhlTeamSearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [summary, setSummary] = useState<SpbhlTeamSyncResult | null>(null);
  const operationLocked = useRef(false);
  const operationGeneration = useRef(0);
  const statusGeneration = useRef(0);
  const searchGeneration = useRef(0);
  const activeTeamId = useRef(teamId);
  const mounted = useRef(true);

  const loadStatus = useCallback(async () => {
    const generation = ++statusGeneration.current;
    setLoading(true);
    setError(null);
    try {
      const nextStatus = await getTeamSpbhlStatus(teamId);
      if (mounted.current && generation === statusGeneration.current) setStatus(nextStatus);
    } catch (requestError) {
      if (mounted.current && generation === statusGeneration.current) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить привязку СПбХЛ.");
      }
    } finally {
      if (mounted.current && generation === statusGeneration.current) setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    mounted.current = true;
    activeTeamId.current = teamId;
    operationLocked.current = false;
    setBusy(null);
    setStatus(null);
    setTitle("");
    setResults([]);
    setError(null);
    setMessage(null);
    setWarning(null);
    setSummary(null);
    void loadStatus();
    return () => {
      mounted.current = false;
      operationGeneration.current += 1;
      statusGeneration.current += 1;
      searchGeneration.current += 1;
    };
  }, [loadStatus, teamId]);

  const beginOperation = (operation: BusyOperation): number | null => {
    if (operationLocked.current) return null;
    operationLocked.current = true;
    setBusy(operation);
    return ++operationGeneration.current;
  };

  const isCurrentOperation = (generation: number, operationTeamId: string) =>
    mounted.current &&
    generation === operationGeneration.current &&
    operationTeamId === activeTeamId.current;

  const finishOperation = (generation: number, operationTeamId: string) => {
    if (!isCurrentOperation(generation, operationTeamId)) return;
    operationLocked.current = false;
    setBusy(null);
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = title.trim();
    setMessage(null);
    setWarning(null);
    setSummary(null);
    if (normalized.length < 2 || normalized.length > 100) {
      setError("Введите от 2 до 100 символов.");
      return;
    }
    const operationTeamId = teamId;
    const operation = beginOperation("search");
    if (operation === null) return;
    const search = ++searchGeneration.current;
    setError(null);
    try {
      const found = await searchSpbhlTeams(teamId, normalized);
      if (isCurrentOperation(operation, operationTeamId) && search === searchGeneration.current) setResults(found);
    } catch (requestError) {
      if (isCurrentOperation(operation, operationTeamId) && search === searchGeneration.current) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось найти команду СПбХЛ.");
      }
    } finally {
      finishOperation(operation, operationTeamId);
    }
  };

  const handleBind = async (item: SpbhlTeamSearchItem) => {
    if (!window.confirm(`Привязать HockeyPlanner-команду к «${item.name}»?`)) return;
    const operationTeamId = teamId;
    const operation = beginOperation("bind");
    if (operation === null) return;
    setError(null);
    setMessage(null);
    setWarning(null);
    try {
      const result = await bindTeamSpbhl(teamId, { spbhlTeamId: item.teamId, spbhlTeamName: item.name });
      if (!isCurrentOperation(operation, operationTeamId)) return;
      setStatus(result.link);
      setResults([]);
      setSummary(result.sync);
      if (result.initialSyncSucceeded) {
        setMessage("Команда привязана. Расписание синхронизировано.");
      } else {
        setWarning(result.syncError || "Команда привязана, но расписание пока не удалось загрузить.");
      }
    } catch (requestError) {
      if (isCurrentOperation(operation, operationTeamId)) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось привязать команду.");
      }
    } finally {
      finishOperation(operation, operationTeamId);
    }
  };

  const handleSync = async () => {
    const operationTeamId = teamId;
    const operation = beginOperation("sync");
    if (operation === null) return;
    setError(null);
    setMessage(null);
    setWarning(null);
    try {
      const result = await syncTeamSpbhlNow(teamId);
      if (!isCurrentOperation(operation, operationTeamId)) return;
      setSummary(result);
      setMessage("Расписание обновлено.");
      await loadStatus();
    } catch (requestError) {
      if (isCurrentOperation(operation, operationTeamId)) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось синхронизировать расписание.");
      }
    } finally {
      finishOperation(operation, operationTeamId);
    }
  };

  const handleUnbind = async () => {
    const confirmed = window.confirm(
      "Удалить привязку к СПбХЛ?\n\nРанее импортированные матчи останутся в HockeyPlanner.\nНовые изменения расписания больше не будут синхронизироваться.",
    );
    if (!confirmed) return;
    const operationTeamId = teamId;
    const operation = beginOperation("unbind");
    if (operation === null) return;
    setError(null);
    setWarning(null);
    setSummary(null);
    try {
      const nextStatus = await unbindTeamSpbhl(teamId);
      if (!isCurrentOperation(operation, operationTeamId)) return;
      setStatus(nextStatus);
      setResults([]);
      setTitle("");
      setMessage("Привязка к СПбХЛ удалена.");
    } catch (requestError) {
      if (isCurrentOperation(operation, operationTeamId)) {
        setError(requestError instanceof Error ? requestError.message : "Не удалось удалить привязку.");
      }
    } finally {
      finishOperation(operation, operationTeamId);
    }
  };

  if (loading && !status) {
    return <section style={{ ...cardStyle, marginTop: 14 }}><LoadingIndicator text="Загружаем привязку СПбХЛ..." /></section>;
  }

  if (!status) {
    return (
      <section style={{ ...cardStyle, marginTop: 14, display: "grid", gap: 12 }}>
        {error && <div role="alert" style={{ color: "var(--hp-danger)" }}>{error}</div>}
        <button type="button" onClick={() => void loadStatus()} style={buttonStyle}>Повторить загрузку</button>
      </section>
    );
  }

  return (
    <section style={{ ...cardStyle, marginTop: 14, display: "grid", gap: 14 }}>
      {error && <div role="alert" style={{ padding: 12, background: "var(--hp-danger-soft)", color: "var(--hp-danger)", borderRadius: 8 }}>{error}</div>}
      {warning && <div role="status" style={{ padding: 12, background: "var(--hp-warning-soft)", color: "var(--hp-warning)", borderRadius: 8 }}>{warning}</div>}
      {message && <div role="status" style={{ padding: 12, background: "var(--hp-success-soft)", color: "var(--hp-success)", borderRadius: 8 }}>{message}</div>}

      {status?.isLinked ? (
        <>
          <div>
            <h2 style={{ margin: "0 0 6px", color: "var(--hp-heading)", fontSize: 20 }}>СПбХЛ</h2>
            <div style={{ color: "var(--hp-success)", fontWeight: 900 }}>✓ Команда привязана</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--hp-text-strong)" }}>{status.spbhlTeamName}</div>
          <div style={{ display: "grid", gap: 5, color: "var(--hp-muted)", fontSize: 14 }}>
            <span>{status.lastSuccessfulSyncAt ? `Последняя синхронизация: ${formatTimestamp(status.lastSuccessfulSyncAt)}` : "Расписание ещё не синхронизировалось"}</span>
            {status.lastSyncAttemptAt && (!status.lastSuccessfulSyncAt || new Date(status.lastSyncAttemptAt) > new Date(status.lastSuccessfulSyncAt)) && (
              <span>Последняя попытка синхронизации: {formatTimestamp(status.lastSyncAttemptAt)}</span>
            )}
          </div>
          {summary && <SyncSummary result={summary} />}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {status.profileUrl && <a href={status.profileUrl} target="_blank" rel="noopener noreferrer" style={{ ...buttonStyle, textDecoration: "none", background: "var(--hp-primary-soft)", color: "var(--hp-primary)" }}>Открыть профиль СПбХЛ ↗</a>}
            <button type="button" onClick={() => void handleSync()} disabled={busy !== null} style={buttonStyle}>{busy === "sync" ? "Синхронизируем..." : "Синхронизировать сейчас"}</button>
            <button type="button" onClick={() => void handleUnbind()} disabled={busy !== null} style={{ ...buttonStyle, background: "var(--hp-danger-soft)", color: "var(--hp-danger)" }}>Удалить привязку</button>
          </div>
        </>
      ) : (
        <>
          <div>
            <h2 style={{ margin: "0 0 6px", color: "var(--hp-heading)", fontSize: 20 }}>Привязка к СПбХЛ</h2>
            <p style={{ margin: 0, color: "var(--hp-muted)", lineHeight: 1.5 }}>Привяжите профиль команды СПбХЛ, чтобы HockeyPlanner мог загружать официальное расписание матчей и обновлять переносы и результаты.</p>
          </div>
          <form onSubmit={(event) => void handleSearch(event)} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="Название команды в СПбХЛ" style={{ ...inputStyle, minWidth: 0, flex: "1 1 180px" }} />
            <button type="submit" disabled={busy !== null} style={{ ...buttonStyle, flex: "1 1 140px" }}>{busy === "search" ? "Ищем..." : "Найти команду"}</button>
          </form>
          <div style={{ color: "var(--hp-muted)", fontSize: 13 }}>После привязки HockeyPlanner сразу попробует загрузить расписание.</div>
          <div style={{ display: "grid", gap: 10 }}>
            {results.map((item) => (
              <article key={item.teamId} style={{ border: "1px solid var(--hp-border)", borderRadius: 8, padding: 12, display: "grid", gridTemplateColumns: item.logoUrl ? "52px minmax(0, 1fr)" : "minmax(0, 1fr)", gap: 12 }}>
                {item.logoUrl && <img src={item.logoUrl} alt="" width={52} height={52} style={{ objectFit: "contain" }} />}
                <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
                  <strong style={{ color: "var(--hp-heading)" }}>{item.name}</strong>
                  {(item.city || item.country) && <span style={{ color: "var(--hp-muted)", fontSize: 13 }}>{[item.city, item.country].filter(Boolean).join(", ")}</span>}
                  {item.divisionName && <span style={{ color: "var(--hp-muted)", fontSize: 13 }}>{item.divisionName}</span>}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a href={item.profileUrl} target="_blank" rel="noopener noreferrer" style={{ ...buttonStyle, textDecoration: "none", background: "var(--hp-primary-soft)", color: "var(--hp-primary)" }}>Открыть в СПбХЛ ↗</a>
                    <button type="button" disabled={busy !== null} onClick={() => void handleBind(item)} style={buttonStyle}>Привязать</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
