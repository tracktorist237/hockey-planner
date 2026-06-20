import { FormEvent, useMemo, useState } from "react";
import { AppReportSeverity, AppReportType, createAppReport } from "src/api/admin";
import { APP_VERSION } from "src/config/version";
import { useSwipeToDismiss } from "src/hooks/useSwipeToDismiss";

interface ReportProblemDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const fieldStyle = {
  display: "grid",
  gap: 6,
  color: "var(--hp-heading)",
  fontSize: 13,
  fontWeight: 800,
} as const;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid var(--hp-border)",
  background: "var(--hp-input-bg)",
  color: "var(--hp-text)",
  padding: "12px",
  fontSize: 15,
} as const;

export function ReportProblemDialog({ isOpen, onClose }: ReportProblemDialogProps) {
  const [type, setType] = useState<AppReportType>(AppReportType.Bug);
  const [severity, setSeverity] = useState<AppReportSeverity>(AppReportSeverity.Medium);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { sheetRef: reportSheetRef, handleProps: reportSheetHandleProps } = useSwipeToDismiss<HTMLFormElement>(onClose);

  const platform = useMemo(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    return nav.userAgentData?.platform || navigator.platform || "web";
  }, []);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !message.trim()) {
      setError("Заполните тему и описание.");
      return;
    }

    setSubmitting(true);

    try {
      await createAppReport({
        type,
        severity,
        title: title.trim(),
        message: message.trim(),
        route: `${window.location.pathname}${window.location.search}`,
        appVersion: APP_VERSION,
        platform,
        userAgent: navigator.userAgent,
      });
      setSent(true);
      setTitle("");
      setMessage("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить обращение.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "16px 12px 0",
      }}
    >
      <form
        ref={reportSheetRef}
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--hp-surface)",
          border: "1px solid var(--hp-border)",
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 -18px 50px rgba(15, 23, 42, 0.25)",
          padding: "14px 16px 22px",
          color: "var(--hp-text)",
        }}
      >
        <div {...reportSheetHandleProps}>
          <div style={{ width: 42, height: 4, borderRadius: 999, background: "var(--hp-border)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "var(--hp-heading)" }}>Сообщить о проблеме</h2>
          <button type="button" onClick={onClose} style={{ border: 0, background: "transparent", color: "var(--hp-muted)", fontSize: 26, cursor: "pointer" }}>
            ×
          </button>
        </div>

        {sent ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 14, background: "var(--hp-success-soft)", color: "var(--hp-success)", fontWeight: 800 }}>
              Спасибо, обращение отправлено.
            </div>
            <button type="button" onClick={() => { setSent(false); onClose(); }} style={{ padding: 13, border: 0, borderRadius: 12, background: "var(--hp-primary)", color: "white", fontWeight: 900 }}>
              Готово
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={fieldStyle}>
                Тип
                <select value={type} onChange={(event) => setType(Number(event.target.value) as AppReportType)} style={inputStyle}>
                  <option value={AppReportType.Bug}>Ошибка</option>
                  <option value={AppReportType.Complaint}>Жалоба</option>
                  <option value={AppReportType.Idea}>Идея</option>
                  <option value={AppReportType.Abuse}>Нарушение</option>
                  <option value={AppReportType.Other}>Другое</option>
                </select>
              </label>
              <label style={fieldStyle}>
                Важность
                <select value={severity} onChange={(event) => setSeverity(Number(event.target.value) as AppReportSeverity)} style={inputStyle}>
                  <option value={AppReportSeverity.Low}>Низкая</option>
                  <option value={AppReportSeverity.Medium}>Средняя</option>
                  <option value={AppReportSeverity.High}>Высокая</option>
                  <option value={AppReportSeverity.Critical}>Критичная</option>
                </select>
              </label>
            </div>

            <label style={fieldStyle}>
              Тема
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} style={inputStyle} />
            </label>

            <label style={fieldStyle}>
              Описание
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} rows={5} style={{ ...inputStyle, resize: "vertical" }} />
            </label>

            {error && <div style={{ padding: 12, borderRadius: 12, background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 800 }}>{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: 13,
                border: 0,
                borderRadius: 12,
                background: submitting ? "var(--hp-muted)" : "var(--hp-primary)",
                color: "white",
                fontWeight: 900,
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              {submitting ? "Отправка..." : "Отправить"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
