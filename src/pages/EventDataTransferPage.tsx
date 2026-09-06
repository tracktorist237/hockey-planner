import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AttendanceTransferMode,
  AttendanceTransferPreview,
  getEvent,
  getEvents,
  previewEventAttendanceTransfer,
  transferEventData,
} from "src/api/events";
import { CheckboxControl } from "src/components/CheckboxControl";
import { ExternalLeagueBadge } from "src/components/ExternalLeagueBadge";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { RadioControl } from "src/components/RadioControl";
import { useAuth } from "src/hooks/useAuth";
import { EventDto, EventLookUpDto } from "src/types/events";

type TransferOptions = {
  attendance: boolean;
  roster: boolean;
  guests: boolean;
  uniformColor: boolean;
  description: boolean;
  deleteSourceEvent: boolean | null;
  attendanceTransferMode: AttendanceTransferMode;
};
type BooleanTransferOption = Exclude<keyof TransferOptions, "attendanceTransferMode">;

const initialOptions: TransferOptions = {
  attendance: true,
  roster: false,
  guests: false,
  uniformColor: false,
  description: false,
  deleteSourceEvent: null,
  attendanceTransferMode: AttendanceTransferMode.MergePreferTarget,
};

const attendanceStatusLabel = (status: number | null) => status === null ? "Нет отметки" : ({
  1: "Не ответил",
  2: "Смогу",
  3: "Не смогу",
  4: "Опоздаю",
}[status] ?? "Не ответил");

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
  const [attendancePreview, setAttendancePreview] = useState<AttendanceTransferPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

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

  useEffect(() => {
    let active = true;
    if (!sourceEventId || !target || !options.attendance) {
      setAttendancePreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return () => { active = false; };
    }

    setPreviewLoading(true);
    setAttendancePreview(null);
    setPreviewError(null);
    void previewEventAttendanceTransfer(sourceEventId, target.id, options.attendanceTransferMode)
      .then(value => { if (active) setAttendancePreview(value); })
      .catch(value => {
        if (!active) return;
        setAttendancePreview(null);
        setPreviewError(value instanceof Error ? value.message : "Не удалось проверить перенос явки.");
      })
      .finally(() => { if (active) setPreviewLoading(false); });
    return () => { active = false; };
  }, [options.attendance, options.attendanceTransferMode, sourceEventId, target]);

  const conflicts = useMemo(() => target ? {
    description: Boolean(target.description?.trim()),
    roster: Boolean(target.roster?.length),
    guests: Boolean(target.attendances?.some(item => item.isGuest)),
    attendance: Boolean(target.attendances?.length),
    uniform: Boolean(target.uniformColorId),
  } : null, [target]);

  const attendanceChanges = useMemo(() => {
    const groups = new Map<string, number>();
    for (const item of attendancePreview?.items.filter(value => value.willChange) ?? []) {
      const label = `${attendanceStatusLabel(item.targetStatus)} → ${attendanceStatusLabel(item.resultingStatus)}`;
      groups.set(label, (groups.get(label) ?? 0) + 1);
    }
    return Array.from(groups.entries());
  }, [attendancePreview]);

  const chooseTarget = async (id: string) => {
    setError(null);
    setLoading(true);
    setOptions(current => ({ ...current, deleteSourceEvent: null }));
    try { setTarget(await getEvent(id)); }
    catch (value) { setError(value instanceof Error ? value.message : "Не удалось загрузить мероприятие."); }
    finally { setLoading(false); }
  };

  const setOption = (key: BooleanTransferOption) => (checked: boolean) => setOptions(current => ({ ...current, [key]: checked }));
  const submit = async () => {
    if (!sourceEventId || !target || submitting || options.deleteSourceEvent === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await transferEventData(sourceEventId, { targetEventId: target.id, ...options, deleteSourceEvent: options.deleteSourceEvent });
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
          <button type="button" onClick={() => { setTarget(null); setOptions(current => ({ ...current, deleteSourceEvent: null })); }} style={{ justifySelf: "start", border: 0, padding: 0, background: "transparent", color: "var(--hp-primary-text)", cursor: "pointer" }}>Выбрать другое</button></article>
        <div style={{ ...cardStyle, display: "grid", gap: 14 }}>
          <CheckboxControl checked={options.attendance} onChange={setOption("attendance")} label="Ответы участников" description={conflicts?.attendance ? "В целевом мероприятии уже есть ответы. Выберите, как их объединить." : undefined} disabled={submitting} />
          {options.attendance && <div style={{ marginLeft: 30, display: "grid", gap: 12, minWidth: 0 }}>
            <h3 style={{ margin: 0, color: "var(--hp-heading)", fontSize: 15 }}>Как объединить ответы участников</h3>
            <div role="radiogroup" aria-label="Как перенести ответы участников" style={{ display: "grid", gap: 10 }}>
              <RadioControl name="attendance-transfer-mode" checked={options.attendanceTransferMode === AttendanceTransferMode.ReplaceTarget} onChange={() => setOptions(current => ({ ...current, attendanceTransferMode: AttendanceTransferMode.ReplaceTarget }))} label={<span style={{ display: "grid", gap: 3 }}><strong>Заменить явку</strong><span style={{ color: "var(--hp-muted)", fontSize: 13, fontWeight: 600 }}>Ответы из исходного мероприятия считаются основными и заменяют ответы в целевом. «Не ответил» не перезаписывает уже выбранный ответ.</span></span>} disabled={submitting} />
              <RadioControl name="attendance-transfer-mode" checked={options.attendanceTransferMode === AttendanceTransferMode.MergePreferTarget} onChange={() => setOptions(current => ({ ...current, attendanceTransferMode: AttendanceTransferMode.MergePreferTarget }))} label={<span style={{ display: "grid", gap: 3 }}><strong>Объединить</strong><span style={{ color: "var(--hp-muted)", fontSize: 13, fontWeight: 600 }}>Уже выбранные ответы в целевом мероприятии сохраняются. Из исходного переносятся только ответы вместо «Не ответил» или отсутствующих.</span></span>} disabled={submitting} />
              <RadioControl name="attendance-transfer-mode" checked={options.attendanceTransferMode === AttendanceTransferMode.ConfirmedOnly} onChange={() => setOptions(current => ({ ...current, attendanceTransferMode: AttendanceTransferMode.ConfirmedOnly }))} label={<span style={{ display: "grid", gap: 3 }}><strong>Перенести только «Смогу»</strong><span style={{ color: "var(--hp-muted)", fontSize: 13, fontWeight: 600 }}>Все отметки «Смогу» из исходного мероприятия переносятся в целевое, даже если там было «Не смогу». Остальные ответы не меняются.</span></span>} disabled={submitting} />
            </div>
            {previewLoading && <span style={{ color: "var(--hp-muted)", fontSize: 14 }}>Проверяем изменения явки...</span>}
            {previewError && <span role="alert" style={{ color: "var(--hp-danger)", fontSize: 14 }}>{previewError}</span>}
            {!previewLoading && attendancePreview && <div style={{ display: "grid", gap: 6, color: "var(--hp-text)", fontSize: 14 }}>
              <strong>Изменится явка {attendancePreview.changedCount} участников</strong>
              {attendanceChanges.map(([label, count]) => <span key={label}>{count}: {label}</span>)}
              {attendancePreview.changedCount > 0 && <details>
                <summary style={{ cursor: "pointer", color: "var(--hp-primary-text)", fontWeight: 700 }}>Показать участников</summary>
                <div style={{ display: "grid", gap: 5, marginTop: 8 }}>
                  {attendancePreview.items.filter(item => item.willChange).map(item => <span key={item.userId} style={{ overflowWrap: "anywhere" }}>
                    {item.userDisplayName || "Участник"}: {attendanceStatusLabel(item.targetStatus)} → {attendanceStatusLabel(item.resultingStatus)}
                  </span>)}
                </div>
              </details>}
            </div>}
          </div>}
          <CheckboxControl checked={options.roster} onChange={setOption("roster")} label="Состав и звенья" description={<span style={{ display: "grid", gap: 4 }}>{conflicts?.roster && <span>Текущий состав целевого мероприятия будет заменён.</span>}<span>При переносе явки в состав попадут только участники с итоговой отметкой «Смогу». Если часть игроков после объединения явки не сможет участвовать, в звеньях могут появиться свободные места.</span></span>} disabled={submitting} />
          <CheckboxControl checked={options.guests} onChange={setOption("guests")} label="Гости" description={conflicts?.guests ? "Совпадающие гости не будут добавлены повторно." : undefined} disabled={submitting} />
          <CheckboxControl checked={options.uniformColor} onChange={setOption("uniformColor")} label="Цвет формы" description={conflicts?.uniform ? "Текущий цвет формы будет заменён." : undefined} disabled={submitting} />
          <CheckboxControl checked={options.description} onChange={setOption("description")} label="Описание мероприятия" description={conflicts?.description ? "Текущее описание целевого мероприятия будет заменено." : undefined} disabled={submitting} />
          <div style={{ borderTop: "1px solid var(--hp-border)", paddingTop: 14, display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0, color: "var(--hp-heading)", fontSize: 15 }}>Удалить исходное мероприятие после переноса?</h3>
            <div role="radiogroup" aria-label="Удалить исходное мероприятие после переноса?" style={{ display: "grid", gap: 10 }}>
              <RadioControl name="delete-source-event" checked={options.deleteSourceEvent === true} onChange={() => setOptions(current => ({ ...current, deleteSourceEvent: true }))} label={<span style={{ display: "grid", gap: 3 }}><strong>Да</strong><span style={{ color: "var(--hp-muted)", fontSize: 13, fontWeight: 600 }}>Исходное мероприятие будет удалено после успешного переноса данных.</span></span>} disabled={submitting} />
              <RadioControl name="delete-source-event" checked={options.deleteSourceEvent === false} onChange={() => setOptions(current => ({ ...current, deleteSourceEvent: false }))} label={<span style={{ display: "grid", gap: 3 }}><strong>Нет</strong><span style={{ color: "var(--hp-muted)", fontSize: 13, fontWeight: 600 }}>Оба мероприятия останутся.</span></span>} disabled={submitting} />
            </div>
          </div>
        </div>
        <button type="button" disabled={submitting || options.deleteSourceEvent === null || (options.attendance && (previewLoading || !attendancePreview))} onClick={() => void submit()} style={{ width: "100%", padding: 13, borderRadius: 8, border: 0, background: "var(--hp-primary)", color: "white", fontWeight: 800, cursor: submitting ? "wait" : "pointer", opacity: submitting || options.deleteSourceEvent === null || (options.attendance && (previewLoading || !attendancePreview)) ? .65 : 1 }}>{submitting ? "Переносим..." : "Перенести выбранное"}</button>
      </section>}
    </div>
  </main>;
}
