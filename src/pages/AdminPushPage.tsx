import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { broadcastPush, PushBroadcastResult } from "src/api/push";
import { CurrentPlayerHeader } from "src/CurrentPlayerHeader";

export function AdminPushPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/events");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PushBroadcastResult | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!title.trim() || !body.trim()) {
      setError("Заполните заголовок и текст уведомления.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await broadcastPush({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || "/events",
      });
      setResult(data);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Не удалось отправить push.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => navigate("/settings")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "1px solid #e0e0e0",
            background: "#fff",
            cursor: "pointer",
            fontSize: 18,
          }}
          aria-label="Назад в настройки"
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <CurrentPlayerHeader />
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Админ: push-рассылка</h1>
        <p style={{ marginTop: 0, color: "#666" }}>
          Страница доступна только по прямому URL. Кнопок перехода в приложении нет.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Заголовок</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например: Напоминание о тренировке"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #cfcfcf" }}
              maxLength={120}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Текст</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Текст push-уведомления"
              rows={4}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #cfcfcf", resize: "vertical" }}
              maxLength={500}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Ссылка при клике</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="/events"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #cfcfcf" }}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: submitting ? "#90a4ae" : "#1976d2",
              color: "#fff",
              fontWeight: 600,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Отправка..." : "Отправить всем"}
          </button>
        </form>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 10,
              background: "#ffebee",
              color: "#c62828",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 10,
              background: "#e8f5e9",
              color: "#2e7d32",
            }}
          >
            Отправлено: {result.sent} из {result.total}. Удалено неактуальных подписок: {result.removed}.
          </div>
        )}
      </div>
    </div>
  );
}
