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
    </>
  );
};
