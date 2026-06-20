import { EditableEventTitle } from "src/pages/CreateEventPage/components/EditableEventTitle";
import { AddOptionalSectionButton } from "src/pages/CreateEventPage/components/AddOptionalSectionButton";
import { useEffect, useState } from "react";

interface EventDetailsFieldsProps {
  title: string;
  description: string;
  startTime: string;
  isPractice: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
}

export const EventDetailsFields = ({
  title,
  description,
  startTime,
  isPractice,
  onTitleChange,
  onDescriptionChange,
  onStartTimeChange,
}: EventDetailsFieldsProps) => {
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(Boolean(description));

  useEffect(() => {
    if (description) {
      setIsDescriptionVisible(true);
    }
  }, [description]);

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
