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
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "16px", color: "#333" }}>
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
            border: "1px solid #e0e0e0",
            borderRadius: "10px",
            fontSize: "16px",
            resize: "vertical",
            backgroundColor: "#fafafa",
            minHeight: "120px",
            lineHeight: "1.5",
            boxSizing: "border-box",
            maxWidth: "100%",
          }}
        />
      </div>

      <div style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "16px", color: "#333" }}>
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
            border: "1px solid #e0e0e0",
            borderRadius: "10px",
            fontSize: "16px",
            backgroundColor: "#fafafa",
            boxSizing: "border-box",
            maxWidth: "100%",
          }}
        />
      </div>

      {isPractice && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fff3e0",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "14px",
            color: "#ef6c00",
            textAlign: "center",
            border: "1px solid #ffe0b2",
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
