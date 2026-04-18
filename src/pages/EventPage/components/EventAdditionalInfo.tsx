import { EventDto } from "src/types/events";

interface EventAdditionalInfoProps {
  event: EventDto;
}

export const EventAdditionalInfo = ({ event }: EventAdditionalInfoProps) => {
  return (
    <>
      {event.description && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📝</span>
            <span>Описание</span>
          </h3>
          <p style={{ margin: 0, fontSize: "15px", color: "#555", lineHeight: "1.6" }}>{event.description}</p>
        </div>
      )}

      {(event.locationName || event.locationAddress || event.iceRinkNumber) && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📍</span>
            <span>Место проведения</span>
          </h3>
          {event.locationName && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", color: "#666", flexShrink: 0 }}>🏢</span>
              <span style={{ fontSize: "15px", color: "#333", lineHeight: "1.4" }}>{event.locationName}</span>
            </div>
          )}
          {event.locationAddress && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", color: "#666", flexShrink: 0 }}>🗺️</span>
              <span style={{ fontSize: "15px", color: "#333", lineHeight: "1.4" }}>{event.locationAddress}</span>
            </div>
          )}
          {event.iceRinkNumber && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "#666", flexShrink: 0 }}>🏒</span>
              <span style={{ fontSize: "15px", color: "#333", lineHeight: "1.4" }}>{event.iceRinkNumber}</span>
            </div>
          )}
        </div>
      )}

      {event.exercises && event.exercises.length > 0 && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>🏋️</span>
            <span>Упражнения тренировки</span>
          </h3>
          <div style={{ display: "grid", gap: "8px" }}>
            {event.exercises.map((exercise, index) => (
              <a
                key={exercise.id}
                href={exercise.videoUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "10px 12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "10px",
                  border: "1px solid #e0e0e0",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: "14px", color: "#1a237e", fontWeight: "600" }}>
                  {index + 1}. {exercise.name}
                </span>
                <span style={{ fontSize: "13px", color: "#1976d2" }}>Открыть видео ↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {event.type === 2 && event.uniformColor?.imageUrl && (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "12px",
            marginBottom: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "14px",
              fontWeight: "600",
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🎽</span>
            <span>Цвет формы</span>
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px",
              borderRadius: "8px",
              border: "1px solid #eceff1",
              backgroundColor: "#fafbfc",
            }}
          >
            <img
              src={event.uniformColor.imageUrl}
              alt="Цвет формы команды"
              style={{
                width: "72px",
                height: "72px",
                objectFit: "cover",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
                backgroundColor: "white",
              }}
            />
            <div style={{ display: "grid", gap: "2px" }}>
              <span style={{ fontSize: "16px", color: "#1a237e", fontWeight: 600 }}>{event.uniformColor.name}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
