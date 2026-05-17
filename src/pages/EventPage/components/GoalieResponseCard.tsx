import { useCallback, useEffect, useState } from "react";
import {
  applyForGoalieRequest,
  EventGoaliesDto,
  getEventGoalies,
  GoalieApplicationStatus,
  updateGoalieApplicationStatus,
} from "src/api/goalies";

interface GoalieResponseCardProps {
  eventId: string;
  currentUserId: string | null;
}

const statusLabel: Record<GoalieApplicationStatus, string> = {
  [GoalieApplicationStatus.Pending]: "Заявка отправлена, ждём решения",
  [GoalieApplicationStatus.Accepted]: "Админ принял заявку",
  [GoalieApplicationStatus.Rejected]: "Заявка отклонена",
  [GoalieApplicationStatus.Proposed]: "Админ предложил вам участие",
  [GoalieApplicationStatus.Confirmed]: "Вы подтвердили участие",
  [GoalieApplicationStatus.Declined]: "Вы отказались",
  [GoalieApplicationStatus.Cancelled]: "Заявка отменена",
};

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const GoalieResponseCard = ({ eventId, currentUserId }: GoalieResponseCardProps) => {
  const [data, setData] = useState<EventGoaliesDto | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoalies = useCallback(async () => {
    if (!currentUserId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setData(await getEventGoalies(eventId, currentUserId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить данные вратаря");
    } finally {
      setLoading(false);
    }
  }, [currentUserId, eventId]);

  useEffect(() => {
    void loadGoalies();
  }, [loadGoalies]);

  const runAction = async (action: () => Promise<void>) => {
    setSubmitting(true);
    setError(null);
    try {
      await action();
      await loadGoalies();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Действие не выполнено");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !data?.isGoalie) {
    return null;
  }

  const myApplication = data?.myApplication ?? null;
  const canConfirm =
    myApplication?.status === GoalieApplicationStatus.Accepted ||
    myApplication?.status === GoalieApplicationStatus.Proposed;
  const canDecline =
    myApplication?.status === GoalieApplicationStatus.Accepted ||
    myApplication?.status === GoalieApplicationStatus.Proposed ||
    myApplication?.status === GoalieApplicationStatus.Confirmed;
  const canCancel = myApplication?.status === GoalieApplicationStatus.Pending;
  const canApplyAgain = Boolean(
    data?.request &&
    data.canApply &&
    myApplication &&
    (
      myApplication.status === GoalieApplicationStatus.Rejected ||
      myApplication.status === GoalieApplicationStatus.Declined ||
      myApplication.status === GoalieApplicationStatus.Cancelled
    )
  );

  return (
    <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "16px", color: "var(--hp-heading)", display: "flex", alignItems: "center", gap: 8 }}>
        <span>🥅</span>
        <span>Твой ответ как вратаря</span>
      </h3>

      {loading && <div style={{ color: "var(--hp-muted)" }}>Загружаем...</div>}
      {error && <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, background: "var(--hp-danger-soft)", color: "var(--hp-danger)" }}>{error}</div>}

      {!loading && data && (
        <>
          {data.currentUserConflict && (
            <div style={{ padding: 12, borderRadius: 12, background: "var(--hp-warning-soft)", color: "var(--hp-warning)", border: "1px solid var(--hp-warning-border)", marginBottom: 12, fontWeight: 700 }}>
              Конфликт: вы уже подтверждены на “{data.currentUserConflict.title}” {formatDateTime(data.currentUserConflict.startTime)}
            </div>
          )}

          {!data.request && (
            <div style={{ color: "var(--hp-muted)", lineHeight: 1.45 }}>
              По этому мероприятию пока нет объявления для вратарей.
            </div>
          )}

          {data.request && (!myApplication || canApplyAgain) && data.canApply && (
            <div style={{ display: "grid", gap: 10 }}>
              {data.request.priceText && <div style={{ color: "var(--hp-text)" }}>Цена: {data.request.priceText}</div>}
              {myApplication && canApplyAgain && (
                <div style={{ padding: 12, borderRadius: 12, background: "var(--hp-warning-soft)", color: "var(--hp-warning)", fontWeight: 800 }}>
                  Предыдущий ответ: {statusLabel[myApplication.status]}. Можно откликнуться снова.
                </div>
              )}
              <textarea
                value={applicationMessage}
                onChange={(event) => setApplicationMessage(event.target.value)}
                placeholder="Комментарий к заявке, если нужно"
                rows={3}
                style={{ padding: 10, borderRadius: 10, border: "1px solid var(--hp-border)", resize: "vertical" }}
              />
              <button
                type="button"
                onClick={() =>
                  runAction(async () => {
                    await applyForGoalieRequest(eventId, currentUserId!, applicationMessage.trim() || null);
                    setApplicationMessage("");
                  })
                }
                disabled={submitting}
                style={{ padding: "14px 16px", border: 0, borderRadius: 12, background: "var(--hp-success)", color: "white", fontSize: 16, fontWeight: 900, cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.75 : 1 }}
              >
                {canApplyAgain ? "Откликнуться снова" : "Откликнуться"}
              </button>
            </div>
          )}

          {data.request && !myApplication && !data.canApply && (
            <div style={{ color: "var(--hp-muted)", lineHeight: 1.45 }}>
              Объявление есть, но оно недоступно для отклика с текущими настройками.
            </div>
          )}

          {myApplication && !canApplyAgain && (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 12, background: "var(--hp-purple-soft)", color: "var(--hp-purple)", fontWeight: 800 }}>
                {statusLabel[myApplication.status]}
              </div>
              {canConfirm && (
                <button
                  type="button"
                  onClick={() => runAction(() => updateGoalieApplicationStatus(eventId, currentUserId!, myApplication.id, GoalieApplicationStatus.Confirmed).then(() => undefined))}
                  disabled={submitting}
                  style={{ padding: "14px 16px", border: 0, borderRadius: 12, background: "var(--hp-success)", color: "white", fontSize: 16, fontWeight: 900, cursor: submitting ? "wait" : "pointer" }}
                >
                  Подтвердить участие
                </button>
              )}
              {canDecline && (
                <button
                  type="button"
                  onClick={() => runAction(() => updateGoalieApplicationStatus(eventId, currentUserId!, myApplication.id, GoalieApplicationStatus.Declined).then(() => undefined))}
                  disabled={submitting}
                  style={{ padding: "14px 16px", border: 0, borderRadius: 12, background: "var(--hp-danger)", color: "white", fontSize: 16, fontWeight: 900, cursor: submitting ? "wait" : "pointer" }}
                >
                  Отказаться
                </button>
              )}
              {canCancel && (
                <button
                  type="button"
                  onClick={() => runAction(() => updateGoalieApplicationStatus(eventId, currentUserId!, myApplication.id, GoalieApplicationStatus.Cancelled).then(() => undefined))}
                  disabled={submitting}
                  style={{ padding: "12px 16px", border: "1px solid var(--hp-border)", borderRadius: 12, background: "var(--hp-surface-soft)", color: "var(--hp-muted)", fontSize: 15, fontWeight: 800, cursor: submitting ? "wait" : "pointer" }}
                >
                  Отменить ответ
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
