interface EventDetailsFieldsProps {
  description: string;
  startTime: string;
  isPractice: boolean;
  onDescriptionChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
}

export const EventDetailsFields = ({
  description,
  startTime,
  isPractice,
  onDescriptionChange,
  onStartTimeChange,
}: EventDetailsFieldsProps) => {
  return (
    <>
      <div style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "16px", color: "var(--hp-text)" }}>
          Описание
        </label>
        <textarea
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
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--hp-warning-soft)",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "14px",
            color: "var(--hp-warning)",
            textAlign: "center",
            border: "1px solid var(--hp-warning-border)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <strong>Название события:</strong> "Тренировка"
        </div>
      )}
    </>
  );
};
