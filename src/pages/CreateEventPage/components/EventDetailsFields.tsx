import { EditableEventTitle } from "src/pages/CreateEventPage/components/EditableEventTitle";
import { AddOptionalSectionButton } from "src/pages/CreateEventPage/components/AddOptionalSectionButton";
import { useEffect, useState } from "react";

interface EventDetailsFieldsProps {
  title: string;
  description: string;
  startTime: string;
  durationMinutes: number;
  isPractice: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onDurationChange: (value: number) => void;
  startTimeLocked?: boolean;
}

export const EventDetailsFields = ({
  title,
  description,
  startTime,
  durationMinutes,
  isPractice,
  onTitleChange,
  onDescriptionChange,
  onStartTimeChange,
  onDurationChange,
  startTimeLocked = false,
}: EventDetailsFieldsProps) => {
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(Boolean(description));

  useEffect(() => {
    if (description) {
      setIsDescriptionVisible(true);
    }
  }, [description]);

  const durationHours = Math.floor(durationMinutes / 60);
  const durationMinutePart = durationMinutes % 60;

  return (
    <>
      {isDescriptionVisible ? (
        <div style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "16px", color: "var(--hp-text)" }}>
            Описание
          </label>
          <textarea
            autoFocus={!description}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Дополнительная информация о событии..."
            rows={4}
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid var(--hp-border)",
              borderRadius: "10px",
              fontSize: "16px",
              resize: "vertical",
              backgroundColor: "var(--hp-surface-soft)",
              color: "var(--hp-text)",
              minHeight: "120px",
              lineHeight: "1.5",
              boxSizing: "border-box",
              maxWidth: "100%",
            }}
          />
        </div>
      ) : (
        <AddOptionalSectionButton onClick={() => setIsDescriptionVisible(true)}>
          + Добавить описание
        </AddOptionalSectionButton>
      )}

      <div style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "16px", color: "var(--hp-text)" }}>
          Дата и время начала *
        </label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
          required
          disabled={startTimeLocked}
          style={{
            width: "100%",
            padding: "14px",
            border: "1px solid var(--hp-border)",
            borderRadius: "10px",
            fontSize: "16px",
            backgroundColor: "var(--hp-surface-soft)",
            color: "var(--hp-text)",
            boxSizing: "border-box",
            maxWidth: "100%",
          }}
        />
      </div>

      <div style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "16px", color: "var(--hp-text)" }}>
          Длительность мероприятия *
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <label style={{ display: "grid", gap: "5px", color: "var(--hp-muted)", fontSize: "12px", fontWeight: 600 }}>
            Часы
            <select
              value={durationHours}
              onChange={(event) => {
                const hours = Number(event.target.value);
                onDurationChange(hours === 24 ? 1440 : hours * 60 + durationMinutePart);
              }}
              required
              style={{ width: "100%", padding: "13px 12px", border: "1px solid var(--hp-border)", borderRadius: "10px", backgroundColor: "var(--hp-surface-soft)", color: "var(--hp-text)", fontSize: "16px", boxSizing: "border-box" }}
            >
              {Array.from({ length: 25 }, (_, hour) => (
                <option key={hour} value={hour}>{hour} ч</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: "5px", color: "var(--hp-muted)", fontSize: "12px", fontWeight: 600 }}>
            Минуты
            <select
              value={durationMinutePart}
              onChange={(event) => onDurationChange(durationHours * 60 + Number(event.target.value))}
              disabled={durationHours === 24}
              required
              style={{ width: "100%", padding: "13px 12px", border: "1px solid var(--hp-border)", borderRadius: "10px", backgroundColor: "var(--hp-surface-soft)", color: "var(--hp-text)", fontSize: "16px", boxSizing: "border-box" }}
            >
              {Array.from({ length: 60 }, (_, minute) => (
                <option key={minute} value={minute}>{minute} мин</option>
              ))}
            </select>
          </label>
        </div>
        {durationMinutes < 1 && (
          <div style={{ marginTop: "6px", color: "var(--hp-danger)", fontSize: "12px" }}>Длительность должна быть больше нуля.</div>
        )}
      </div>

      {isPractice && (
        <div style={{ marginBottom: "20px" }}>
          <EditableEventTitle
            label="Название события"
            value={title || "Тренировка"}
            onChange={onTitleChange}
            backgroundColor="var(--hp-warning-soft)"
            borderColor="var(--hp-warning-border)"
            color="var(--hp-warning)"
            quoted
          />
        </div>
      )}
    </>
  );
};
