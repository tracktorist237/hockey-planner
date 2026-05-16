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
    <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "16px", color: "#1a237e", display: "flex", alignItems: "center", gap: 8 }}>
        <span>🥅</span>
        <span>Твой ответ как вратаря</span>
      </h3>

      {loading && <div style={{ color: "#607d8b" }}>Загружаем...</div>}
      {error && <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, background: "#ffebee", color: "#c62828" }}>{error}</div>}

      {!loading && data && (
        <>
          {data.currentUserConflict && (
            <div style={{ padding: 12, borderRadius: 12, background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa", marginBottom: 12, fontWeight: 700 }}>
              Конфликт: вы уже подтверждены на “{data.currentUserConflict.title}” {formatDateTime(data.currentUserConflict.startTime)}
            </div>
          )}

          {!data.request && (
            <div style={{ color: "#64748b", lineHeight: 1.45 }}>
              По этому мероприятию пока нет объявления для вратарей.
            </div>
          )}

          {data.request && (!myApplication || canApplyAgain) && data.canApply && (
            <div style={{ display: "grid", gap: 10 }}>
              {data.request.priceText && <div style={{ color: "#334155" }}>Цена: {data.request.priceText}</div>}
              {myApplication && canApplyAgain && (
                <div style={{ padding: 12, borderRadius: 12, background: "#fff7ed", color: "#9a3412", fontWeight: 800 }}>
                  Предыдущий ответ: {statusLabel[myApplication.status]}. Можно откликнуться снова.
                </div>
              )}
              <textarea
                value={applicationMessage}
                onChange={(event) => setApplicationMessage(event.target.value)}
                placeholder="Комментарий к заявке, если нужно"
                rows={3}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }}
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
                style={{ padding: "14px 16px", border: 0, borderRadius: 12, background: "#0f766e", color: "white", fontSize: 16, fontWeight: 900, cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.75 : 1 }}
              >
                {canApplyAgain ? "Откликнуться снова" : "Откликнуться"}
              </button>
            </div>
          )}

          {data.request && !myApplication && !data.canApply && (
            <div style={{ color: "#64748b", lineHeight: 1.45 }}>
              Объявление есть, но оно недоступно для отклика с текущими настройками.
            </div>
          )}

          {myApplication && !canApplyAgain && (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 12, background: "#eef2ff", color: "#1e3a8a", fontWeight: 800 }}>
                {statusLabel[myApplication.status]}
              </div>
              {canConfirm && (
                <button
                  type="button"
                  onClick={() => runAction(() => updateGoalieApplicationStatus(eventId, currentUserId!, myApplication.id, GoalieApplicationStatus.Confirmed).then(() => undefined))}
                  disabled={submitting}
                  style={{ padding: "14px 16px", border: 0, borderRadius: 12, background: "#2e7d32", color: "white", fontSize: 16, fontWeight: 900, cursor: submitting ? "wait" : "pointer" }}
                >
                  Подтвердить участие
                </button>
              )}
              {canDecline && (
                <button
                  type="button"
                  onClick={() => runAction(() => updateGoalieApplicationStatus(eventId, currentUserId!, myApplication.id, GoalieApplicationStatus.Declined).then(() => undefined))}
                  disabled={submitting}
                  style={{ padding: "14px 16px", border: 0, borderRadius: 12, background: "#c62828", color: "white", fontSize: 16, fontWeight: 900, cursor: submitting ? "wait" : "pointer" }}
                >
                  Отказаться
                </button>
              )}
              {canCancel && (
                <button
                  type="button"
                  onClick={() => runAction(() => updateGoalieApplicationStatus(eventId, currentUserId!, myApplication.id, GoalieApplicationStatus.Cancelled).then(() => undefined))}
                  disabled={submitting}
                  style={{ padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: 12, background: "#f8fafc", color: "#475569", fontSize: 15, fontWeight: 800, cursor: submitting ? "wait" : "pointer" }}
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
