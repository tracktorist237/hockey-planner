import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EventGoaliesDto,
  getEventGoalies,
  GoalieApplicationDto,
  GoalieApplicationStatus,
  GoalieRequestResponseMode,
  GoalieRequestVisibility,
  GoalieUserDto,
  proposeGoalie,
  updateGoalieApplicationStatus,
  upsertGoalieRequest,
} from "src/api/goalies";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { PlayerAvatar } from "src/components/PlayerAvatar";

interface GoaliesPanelProps {
  eventId: string;
  currentUserId: string | null;
  embedded?: boolean;
}

const statusLabel: Record<GoalieApplicationStatus, string> = {
  [GoalieApplicationStatus.Pending]: "Ожидает решения",
  [GoalieApplicationStatus.Accepted]: "Принят админом",
  [GoalieApplicationStatus.Rejected]: "Отклонён",
  [GoalieApplicationStatus.Proposed]: "Предложено админом",
  [GoalieApplicationStatus.Confirmed]: "Подтверждён",
  [GoalieApplicationStatus.Declined]: "Отказался",
  [GoalieApplicationStatus.Cancelled]: "Отменено",
};

const statusColor = (status: GoalieApplicationStatus): string => {
  if (status === GoalieApplicationStatus.Confirmed) return "var(--hp-success)";
  if (status === GoalieApplicationStatus.Accepted || status === GoalieApplicationStatus.Proposed) return "var(--hp-primary-hover)";
  if (status === GoalieApplicationStatus.Rejected || status === GoalieApplicationStatus.Declined) return "var(--hp-danger)";
  return "var(--hp-warning)";
};

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const goalieName = (goalie: GoalieUserDto): string =>
  `${goalie.lastName ?? ""} ${goalie.firstName ?? ""}`.trim() || "Вратарь";

export const GoaliesPanel = ({ eventId, currentUserId, embedded = false }: GoaliesPanelProps) => {
  const [data, setData] = useState<EventGoaliesDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [neededCount, setNeededCount] = useState(1);
  const [visibility, setVisibility] = useState<GoalieRequestVisibility>(GoalieRequestVisibility.TeamGoaliesOnly);
  const [responseMode, setResponseMode] = useState<GoalieRequestResponseMode>(GoalieRequestResponseMode.Manual);
  const [priceText, setPriceText] = useState("");
  const [description, setDescription] = useState("");
  const [proposalMessage, setProposalMessage] = useState("");
  const [selectedGoalieId, setSelectedGoalieId] = useState("");

  const loadGoalies = useCallback(async () => {
    if (!currentUserId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getEventGoalies(eventId, currentUserId);
      setData(result);
      if (result.request) {
        setNeededCount(result.request.neededCount);
        setVisibility(result.request.visibility);
        setResponseMode(result.request.responseMode);
        setPriceText(result.request.priceText ?? "");
        setDescription(result.request.description ?? "");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить вратарей");
    } finally {
      setLoading(false);
    }
  }, [currentUserId, eventId]);

  useEffect(() => {
    void loadGoalies();
  }, [loadGoalies]);

  const confirmedCount = data?.request?.confirmedCount ?? 0;
  const applications = useMemo(() => data?.request?.applications ?? [], [data?.request?.applications]);
  const confirmedApplications = useMemo(
    () => applications.filter((application) => application.status === GoalieApplicationStatus.Confirmed),
    [applications],
  );

  const runAction = async (action: () => Promise<void>) => {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      await loadGoalies();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Действие не выполнено");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveRequest = () =>
    runAction(async () => {
      if (!currentUserId) return;
      await upsertGoalieRequest(eventId, currentUserId, {
        neededCount,
        visibility,
        responseMode,
        priceText: priceText.trim() || null,
        description: description.trim() || null,
      });
      setMessage("Объявление сохранено");
    });

  const handlePropose = () =>
    runAction(async () => {
      if (!currentUserId || !selectedGoalieId) return;
      await proposeGoalie(eventId, currentUserId, selectedGoalieId, proposalMessage.trim() || null);
      setSelectedGoalieId("");
      setProposalMessage("");
      setMessage("Предложение отправлено");
    });

  const handleStatus = (application: GoalieApplicationDto, status: GoalieApplicationStatus) =>
    runAction(async () => {
      if (!currentUserId) return;
      await updateGoalieApplicationStatus(eventId, currentUserId, application.id, status);
      setMessage("Статус обновлён");
    });

  const copyPrevious = (requestDescription?: string | null, requestPrice?: string | null) => {
    setDescription(requestDescription ?? "");
    setPriceText(requestPrice ?? "");
    setMessage("Текст и цена скопированы");
  };

  return (
    <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: embedded ? 0 : "16px", padding: "20px", marginBottom: embedded ? 0 : "20px", boxShadow: embedded ? "none" : "var(--hp-shadow-sm)" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: "18px", color: "var(--hp-heading)", display: "flex", alignItems: "center", gap: 8 }}>
        <span>🥅</span>
        <span>Вратари</span>
      </h3>

      {loading && <LoadingIndicator text="Загружаем вкладку вратарей..." />}
      {error && <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, background: "var(--hp-danger-soft)", color: "var(--hp-danger)" }}>{error}</div>}
      {message && <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, background: "var(--hp-success-soft)", color: "var(--hp-success)", fontWeight: 700 }}>{message}</div>}

      {!loading && data && (
        <>
          {data.request && (
            <div style={{ padding: 14, borderRadius: 14, background: "var(--hp-surface-soft)", border: "1px solid var(--hp-border)", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <strong style={{ color: "var(--hp-text-strong)" }}>Нужно вратарей: {confirmedCount}/{data.request.neededCount}</strong>
                <span style={{ color: data.request.status === 2 ? "var(--hp-success)" : "var(--hp-warning)", fontWeight: 800 }}>
                  {data.request.status === 2 ? "Набрано" : data.request.status === 3 ? "Закрыто" : "Открыто"}
                </span>
              </div>
              {data.isGoalie || data.canManage ? (
                <>
                  {data.request.priceText && <div style={{ color: "var(--hp-text)", marginBottom: 6 }}>Цена: {data.request.priceText}</div>}
                  {data.request.description && <div style={{ color: "var(--hp-muted)", lineHeight: 1.45 }}>{data.request.description}</div>}
                </>
              ) : (
                <div style={{ color: "var(--hp-muted)" }}>Команда ищет вратаря на это мероприятие.</div>
              )}
            </div>
          )}

          {data.currentUserConflict && (
            <div style={{ padding: 12, borderRadius: 12, background: "var(--hp-warning-soft)", color: "var(--hp-warning)", border: "1px solid var(--hp-warning-border)", marginBottom: 14, fontWeight: 700 }}>
              Конфликт: вы уже подтверждены на “{data.currentUserConflict.title}” {formatDateTime(data.currentUserConflict.startTime)}
            </div>
          )}

          {data.canManage && (
            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              <strong style={{ color: "var(--hp-heading)" }}>Объявление</strong>
              <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 8 }}>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={neededCount}
                  onChange={(event) => setNeededCount(Number(event.target.value))}
                  style={{ padding: 10, borderRadius: 10, border: "1px solid var(--hp-border)" }}
                />
                <input
                  value={priceText}
                  onChange={(event) => setPriceText(event.target.value)}
                  placeholder="Цена, например 1000 ₽ или по договорённости"
                  style={{ padding: 10, borderRadius: 10, border: "1px solid var(--hp-border)" }}
                />
              </div>
              <select value={visibility} onChange={(event) => setVisibility(Number(event.target.value))} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--hp-border)" }}>
                <option value={GoalieRequestVisibility.TeamGoaliesOnly}>Видят только вратари команды</option>
                <option value={GoalieRequestVisibility.AllGoalies}>Видят все вратари</option>
              </select>
              <select value={responseMode} onChange={(event) => setResponseMode(Number(event.target.value))} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--hp-border)" }}>
                <option value={GoalieRequestResponseMode.Manual}>Ручное принятие заявок</option>
                <option value={GoalieRequestResponseMode.AutoAccept}>Автопринятие первых заявок</option>
              </select>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Текст объявления"
                rows={4}
                style={{ padding: 10, borderRadius: 10, border: "1px solid var(--hp-border)", resize: "vertical" }}
              />
              <button type="button" onClick={handleSaveRequest} disabled={submitting} style={{ padding: "12px 14px", border: 0, borderRadius: 12, background: "var(--hp-primary)", color: "white", fontWeight: 800, cursor: submitting ? "wait" : "pointer" }}>
                Сохранить объявление
              </button>
            </div>
          )}

          {data.myApplication && (
            <div style={{ padding: 12, borderRadius: 12, background: "var(--hp-purple-soft)", marginBottom: 18 }}>
              <div style={{ fontWeight: 800, color: statusColor(data.myApplication.status) }}>
                Ваша заявка: {statusLabel[data.myApplication.status]}
              </div>
            </div>
          )}

          {data.request && (
            <div style={{ marginBottom: 18 }}>
              <strong style={{ color: "var(--hp-heading)" }}>Подтверждённые вратари</strong>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {confirmedApplications.length === 0 && (
                  <div style={{ padding: 12, borderRadius: 12, background: "var(--hp-surface-soft)", border: "1px solid var(--hp-border)", color: "var(--hp-muted)" }}>
                    Пока никто не подтверждён.
                  </div>
                )}
                {confirmedApplications.map((application) => (
                  <div key={application.id} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--hp-success-border)", background: "var(--hp-success-soft)", display: "flex", alignItems: "center", gap: 10 }}>
                    <PlayerAvatar size={38} photoUrl={application.photoUrl} jerseyNumber={application.jerseyNumber} fallbackPrefix="#" badgePrefix="#" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, color: "var(--hp-text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {goalieName(application)}
                      </div>
                      <div style={{ color: "var(--hp-success)", fontSize: 13, fontWeight: 800 }}>Подтверждён</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.canManage && data.request && (
            <div style={{ marginBottom: 18 }}>
              <strong style={{ color: "var(--hp-heading)" }}>Заявки</strong>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {applications.length === 0 && <div style={{ color: "var(--hp-muted)" }}>Заявок пока нет.</div>}
                {applications.map((application) => (
                  <div key={application.id} style={{ padding: 12, borderRadius: 12, border: "1px solid var(--hp-border)", display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <PlayerAvatar size={36} photoUrl={application.photoUrl} jerseyNumber={application.jerseyNumber} fallbackPrefix="#" badgePrefix="#" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, color: "var(--hp-text-strong)" }}>{goalieName(application)}</div>
                        <div style={{ fontSize: 13, color: statusColor(application.status), fontWeight: 700 }}>{statusLabel[application.status]}</div>
                      </div>
                    </div>
                    {application.conflict && <div style={{ color: "var(--hp-warning)", fontSize: 13 }}>Конфликт: {application.conflict.title}, {formatDateTime(application.conflict.startTime)}</div>}
                    {application.message && <div style={{ color: "var(--hp-muted)", fontSize: 13 }}>Комментарий: {application.message}</div>}
                    {application.status === GoalieApplicationStatus.Pending && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => handleStatus(application, GoalieApplicationStatus.Accepted)} disabled={submitting} style={{ flex: 1, padding: 9, border: 0, borderRadius: 10, background: "var(--hp-primary)", color: "white", fontWeight: 800 }}>Принять</button>
                        <button type="button" onClick={() => handleStatus(application, GoalieApplicationStatus.Rejected)} disabled={submitting} style={{ flex: 1, padding: 9, border: 0, borderRadius: 10, background: "var(--hp-danger)", color: "white", fontWeight: 800 }}>Отклонить</button>
                      </div>
                    )}
                    {application.status === GoalieApplicationStatus.Proposed && (
                      <div style={{ padding: 10, borderRadius: 10, background: "var(--hp-purple-soft)", color: "var(--hp-purple)", fontSize: 13, fontWeight: 800 }}>
                        Предложение отправлено. Решение теперь за вратарём.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.canManage && !data.request && (
            <div style={{ padding: 12, borderRadius: 12, background: "var(--hp-surface-soft)", border: "1px solid var(--hp-border)", color: "var(--hp-muted)", marginBottom: 18 }}>
              Чтобы лично предложить вратарю участие, сначала сохраните объявление выше.
            </div>
          )}

          {data.canManage && data.request && data.availableGoalies.length === 0 && (
            <div style={{ padding: 12, borderRadius: 12, background: "var(--hp-surface-soft)", border: "1px solid var(--hp-border)", color: "var(--hp-muted)", marginBottom: 18 }}>
              Нет доступных вратарей для личного предложения: все подходящие уже имеют заявку или предложение.
            </div>
          )}

          {data.canManage && data.request && data.availableGoalies.length > 0 && (
            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              <strong style={{ color: "var(--hp-heading)" }}>Лично предложить вратарю</strong>
              <select value={selectedGoalieId} onChange={(event) => setSelectedGoalieId(event.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--hp-border)" }}>
                <option value="">Выберите вратаря</option>
                {data.availableGoalies.map((goalie) => (
                  <option key={goalie.userId} value={goalie.userId}>
                    {goalieName(goalie)}{goalie.conflict ? " - конфликт" : ""}
                  </option>
                ))}
              </select>
              <input value={proposalMessage} onChange={(event) => setProposalMessage(event.target.value)} placeholder="Комментарий к предложению" style={{ padding: 10, borderRadius: 10, border: "1px solid var(--hp-border)" }} />
              <button type="button" onClick={handlePropose} disabled={submitting || !selectedGoalieId} style={{ padding: "12px 14px", border: 0, borderRadius: 12, background: selectedGoalieId ? "var(--hp-primary)" : "var(--hp-surface-muted)", color: "white", fontWeight: 800 }}>
                Отправить личное предложение
              </button>
            </div>
          )}

          {data.canManage && data.previousRequests.length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--hp-heading)" }}>Скопировать из прошлых объявлений</summary>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {data.previousRequests.map((previous) => (
                  <button key={previous.id} type="button" onClick={() => copyPrevious(previous.description, previous.priceText)} style={{ textAlign: "left", padding: 10, borderRadius: 10, border: "1px solid var(--hp-border)", background: "var(--hp-surface-soft)", cursor: "pointer" }}>
                    <div style={{ fontWeight: 800 }}>Нужно: {previous.neededCount}, цена: {previous.priceText || "не указана"}</div>
                    <div style={{ color: "var(--hp-muted)", fontSize: 13 }}>{previous.description || "Без текста"}</div>
                  </button>
                ))}
              </div>
            </details>
          )}

          {!data.request && !data.canManage && (
            <div style={{ color: "var(--hp-muted)" }}>По этому мероприятию пока нет объявления для вратарей.</div>
          )}
        </>
      )}
    </div>
  );
};

