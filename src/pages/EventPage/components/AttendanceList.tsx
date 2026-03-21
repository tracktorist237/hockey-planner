import { AttendanceLookUpDto } from "src/types/events";

interface AttendanceListProps {
  attendances?: AttendanceLookUpDto[];
  onPlayerClick: (userId: string) => void;
}

export const AttendanceList = ({ attendances, onPlayerClick }: AttendanceListProps) => {
  return (
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
          fontSize: "18px",
          fontWeight: "600",
          color: "#1a237e",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>👥</span>
        <span>Явка игроков ({attendances?.length || 0})</span>
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          <span>Готовы:</span>
          <span style={{ fontWeight: "600", color: "#4caf50" }}>
            {attendances?.filter((attendance) => attendance.status === 2).length || 0}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          <span>Не готовы:</span>
          <span style={{ fontWeight: "600", color: "#f44336" }}>
            {attendances?.filter((attendance) => attendance.status === 3).length || 0}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "14px",
            color: "#666",
          }}
        >
          <span>Не ответили:</span>
          <span style={{ fontWeight: "600", color: "#ff9800" }}>
            {attendances?.filter((attendance) => attendance.status === 1).length || 0}
          </span>
        </div>
      </div>

      <div
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          border: "1px solid #e0e0e0",
          borderRadius: "10px",
          padding: "8px",
        }}
      >
        {attendances?.map((attendance) => (
          <div
            key={attendance.userId}
            style={{
              padding: "12px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
            onClick={() => onPlayerClick(attendance.userId)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor:
                      attendance.status === 2
                        ? "#e8f5e9"
                        : attendance.status === 3
                          ? "#ffebee"
                          : "#fff3e0",
                    color:
                      attendance.status === 2
                        ? "#2e7d32"
                        : attendance.status === 3
                          ? "#c62828"
                          : "#ef6c00",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                >
                  #{attendance.jerseyNumber || "?"}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "500",
                      fontSize: "15px",
                      color: "#1a237e",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#1976d2";
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#1a237e";
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    {attendance.firstName} {attendance.lastName}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color:
                    attendance.status === 2
                      ? "#2e7d32"
                      : attendance.status === 3
                        ? "#c62828"
                        : "#ff9800",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {attendance.status === 2 ? "✅" : attendance.status === 3 ? "❌" : "⏳"}
              </div>
            </div>

            {attendance.notes && (
              <div
                style={{
                  marginLeft: "44px",
                  padding: "8px 12px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  fontSize: "13px",
                  color: "#555",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#666" }}>💬</span>
                <span style={{ fontStyle: "italic", lineHeight: "1.4" }}>{attendance.notes}</span>
              </div>
            )}
          </div>
        )) || <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>Нет данных о явке</div>}
      </div>
    </div>
  );
};
