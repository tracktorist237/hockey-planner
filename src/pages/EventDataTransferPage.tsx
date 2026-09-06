import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvent, getEvents, transferEventData } from "src/api/events";
import { CheckboxControl } from "src/components/CheckboxControl";
import { ExternalLeagueBadge } from "src/components/ExternalLeagueBadge";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { useAuth } from "src/hooks/useAuth";
import { EventDto, EventLookUpDto } from "src/types/events";

type TransferOptions = {
  attendance: boolean;
  roster: boolean;
  guests: boolean;
  uniformColor: boolean;
  description: boolean;
  deleteSourceEvent: boolean;
};

const initialOptions: TransferOptions = {
  attendance: true,
  roster: false,
  guests: false,
  uniformColor: false,
  description: false,
  deleteSourceEvent: false,
};

const formatDate = (value: string) => new Intl.DateTimeFormat("ru-RU", {
  day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
}).format(new Date(value));

const cardStyle = {
  border: "1px solid var(--hp-border)", borderRadius: 8, padding: 14,
  background: "var(--hp-surface)", color: "var(--hp-text)", minWidth: 0,
} as const;

export function EventDataTransferPage() {
  const { id: sourceEventId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [source, setSource] = useState<EventDto | null>(null);
  const [candidates, setCandidates] = useState<EventLookUpDto[]>([]);
  const [target, setTarget] = useState<EventDto | null>(null);
  const [options, setOptions] = useState(initialOptions);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!sourceEventId) return;
    setLoading(true);
    void getEvent(sourceEventId)
      .then(async loadedSource => {
        const list = await getEvents(currentUser?.id, loadedSource.teamId);
        if (!active) return;
        setSource(loadedSource);
        setCandidates((list.events ?? [])
          .filter(item => item.id !== loadedSource.id && item.teamId === loadedSource.teamId)
          .sort((left, right) => Math.abs(Date.parse(left.startTime) - Date.parse(loadedSource.startTime))
            - Math.abs(Date.parse(right.startTime) - Date.parse(loadedSource.startTime))));
      })
      .catch(value => active && setError(value instanceof Error ? value.message : "Не удалось загрузить мероприятия."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [currentUser?.id, sourceEventId]);

  const conflicts = useMemo(() => target ? {
    description: Boolean(target.description?.trim()),
    roster: Boolean(target.roster?.length),
    guests: Boolean(target.attendances?.some(item => item.isGuest)),
    attendance: Boolean(target.attendances?.length),
    uniform: Boolean(target.uniformColorId),
  } : null, [target]);

  const chooseTarget = async (id: string) => {
    setError(null);
    setLoading(true);
    try { setTarget(await getEvent(id)); }
    catch (value) { setError(value instanceof Error ? value.message : "Не удалось загрузить мероприятие."); }
    finally { setLoading(false); }
  };

  const setOption = (key: keyof TransferOptions) => (checked: boolean) => setOptions(current => ({ ...current, [key]: checked }));
  const submit = async () => {
    if (!sourceEventId || !target || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await transferEventData(sourceEventId, { targetEventId: target.id, ...options });
      navigate(`/events/${target.id}`, { replace: true });
    } catch (value) {
      setError(value instanceof Error ? value.message : "Не удалось перенести данные мероприятия.");
      setSubmitting(false);
    }
  };

  if (loading && !source) return <LoadingIndicator text="Загружаем мероприятия..." block />;

  return <main style={{ minHeight: "100vh", background: "var(--hp-bg-gradient)", padding: "16px 12px 80px" }}>
    <div style={{ maxWidth: 680, margin: "0 auto", display: "grid", gap: 16 }}>
      <button type="button" onClick={() => navigate(sourceEventId ? `/events/${sourceEventId}` : "/events")} style={{ justifySelf: "start", border: 0, background: "transparent", color: "var(--hp-primary-text)", fontWeight: 800, cursor: "pointer" }}>← Назад</button>
      <header><h1 style={{ margin: 0, color: "var(--hp-heading)", fontSize: 24 }}>Перенести данные</h1>
        <p style={{ color: "var(--hp-muted)", marginBottom: 0 }}>Выберите мероприятие, в которое нужно перенести данные из «{source?.title}».</p></header>
      {error && <div role="alert" style={{ ...cardStyle, color: "var(--hp-danger)", borderColor: "var(--hp-danger-border)", background: "var(--hp-danger-soft)" }}>{error}</div>}

      {!target ? <section style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0, color: "var(--hp-heading)", fontSize: 18 }}>1. Целевое мероприятие</h2>
        {candidates.length === 0 && !loading && <div style={cardStyle}>В этой команде нет других мероприятий.</div>}
        {candidates.map(item => <article key={item.id} style={{ ...cardStyle, display: "grid", gap: 8 }}>
          <strong style={{ overflowWrap: "anywhere" }}>{item.title || "Без названия"}</strong>
          <span style={{ color: "var(--hp-muted)", fontSize: 14 }}>{formatDate(item.startTime)}</span>
          {item.externalLeagueProvider != null && <span style={{ justifySelf: "start", maxWidth: "100%" }}><ExternalLeagueBadge provider={item.externalLeagueProvider} division={item.externalDivisionName} /></span>}
          <button type="button" onClick={() => void chooseTarget(item.id)} style={{ justifySelf: "start", padding: "10px 16px", borderRadius: 8, border: 0, background: "var(--hp-primary)", color: "white", fontWeight: 800, cursor: "pointer" }}>Выбрать</button>
        </article>)}
      </section> : <section style={{ display: "grid", gap: 14 }}>
        <h2 style={{ margin: 0, color: "var(--hp-heading)", fontSize: 18 }}>2. Что перенести</h2>
        <article style={{ ...cardStyle, display: "grid", gap: 6 }}><strong>{target.title}</strong><span style={{ color: "var(--hp-muted)" }}>{formatDate(target.startTime)}</span>
          {target.externalLeagueProvider != null && <span style={{ justifySelf: "start" }}><ExternalLeagueBadge provider={target.externalLeagueProvider} division={target.externalDivisionName} /></span>}
          <button type="button" onClick={() => setTarget(null)} style={{ justifySelf: "start", border: 0, padding: 0, background: "transparent", color: "var(--hp-primary-text)", cursor: "pointer" }}>Выбрать другое</button></article>
        <div style={{ ...cardStyle, display: "grid", gap: 14 }}>
          <CheckboxControl checked={options.attendance} onChange={setOption("attendance")} label="Ответы участников" description={conflicts?.attendance ? "Ответы уже есть: ответ в целевом мероприятии имеет приоритет." : undefined} disabled={submitting} />
          <CheckboxControl checked={options.roster} onChange={setOption("roster")} label="Состав и звенья" description={conflicts?.roster ? "Текущий состав целевого мероприятия будет заменён." : undefined} disabled={submitting} />
          <CheckboxControl checked={options.guests} onChange={setOption("guests")} label="Гости" description={conflicts?.guests ? "Совпадающие гости не будут добавлены повторно." : undefined} disabled={submitting} />
          <CheckboxControl checked={options.uniformColor} onChange={setOption("uniformColor")} label="Цвет формы" description={conflicts?.uniform ? "Текущий цвет формы будет заменён." : undefined} disabled={submitting} />
          <CheckboxControl checked={options.description} onChange={setOption("description")} label="Описание мероприятия" description={conflicts?.description ? "Текущее описание целевого мероприятия будет заменено." : undefined} disabled={submitting} />
          <div style={{ borderTop: "1px solid var(--hp-border)", paddingTop: 14 }}><CheckboxControl checked={options.deleteSourceEvent} onChange={setOption("deleteSourceEvent")} label="Удалить исходное мероприятие после переноса" description="Удаление нельзя отменить." disabled={submitting} /></div>
        </div>
        <button type="button" disabled={submitting} onClick={() => void submit()} style={{ width: "100%", padding: 13, borderRadius: 8, border: 0, background: "var(--hp-primary)", color: "white", fontWeight: 800, cursor: submitting ? "wait" : "pointer", opacity: submitting ? .65 : 1 }}>{submitting ? "Переносим..." : "Перенести выбранное"}</button>
      </section>}
    </div>
  </main>;
}
