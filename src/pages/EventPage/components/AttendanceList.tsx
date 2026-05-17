import { PlayerAvatar } from "src/components/PlayerAvatar";
import { AttendanceLookUpDto } from "src/types/events";
import { getAdaptiveFontSize } from "src/utils/text";

interface AttendanceListProps {
  attendances?: AttendanceLookUpDto[];
  onPlayerClick: (userId: string) => void;
  avatarUrls?: Record<string, string>;
  eventCreatedAt?: string;
}

const DEFAULT_RESPONSE_TOLERANCE_MS = 5000;

const isSameMoment = (left?: string, right?: string): boolean => {
  if (!left || !right) {
    return false;
  }

  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();

  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
    return false;
  }

  return Math.abs(leftTime - rightTime) <= DEFAULT_RESPONSE_TOLERANCE_MS;
};

const formatResponseTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const AttendanceList = ({ attendances, onPlayerClick, avatarUrls, eventCreatedAt }: AttendanceListProps) => {
  return (
    <div
      style={{
        backgroundColor: "var(--hp-surface)",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "var(--hp-shadow-sm)",
      }}
    >
      <h3
        style={{
          margin: "0 0 16px 0",
          fontSize: "18px",
          fontWeight: "600",
          color: "var(--hp-heading)",
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
            color: "var(--hp-muted)",
          }}
        >
          <span>Готовы:</span>
          <span style={{ fontWeight: "600", color: "var(--hp-success)" }}>
            {attendances?.filter((attendance) => attendance.status === 2).length || 0}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
            fontSize: "14px",
            color: "var(--hp-muted)",
          }}
        >
          <span>Не готовы:</span>
          <span style={{ fontWeight: "600", color: "var(--hp-danger)" }}>
            {attendances?.filter((attendance) => attendance.status === 3).length || 0}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "14px",
            color: "var(--hp-muted)",
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
          border: "1px solid var(--hp-border)",
          borderRadius: "10px",
          padding: "8px",
        }}
      >
        {attendances?.map((attendance) => {
          const showResponseTime =
            Boolean(attendance.respondedAt) &&
            !isSameMoment(attendance.respondedAt, eventCreatedAt);
          const formattedResponseTime = showResponseTime ? formatResponseTime(attendance.respondedAt) : "";

          return (
            <div
              key={attendance.userId}
              style={{
                padding: "12px",
                borderBottom: "1px solid var(--hp-border)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
              onClick={() => onPlayerClick(attendance.userId)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <PlayerAvatar
                    size={32}
                    shape="rounded"
                    photoUrl={attendance.photoUrl ?? avatarUrls?.[attendance.userId]}
                    jerseyNumber={attendance.jerseyNumber}
                    fallbackPrefix="#"
                    badgePrefix="#"
                    fontSize={12}
                    fallbackBg={
                      attendance.status === 2
                        ? "var(--hp-success-soft)"
                        : attendance.status === 3
                          ? "var(--hp-danger-soft)"
                          : "var(--hp-warning-soft)"
                    }
                    fallbackColor={
                      attendance.status === 2
                        ? "var(--hp-success)"
                        : attendance.status === 3
                          ? "var(--hp-danger)"
                          : "var(--hp-warning)"
                    }
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: "500",
                        fontSize: `${getAdaptiveFontSize(`${attendance.firstName ?? ""} ${attendance.lastName ?? ""}`, {
                          base: 15,
                          min: 11,
                          startShrinkAt: 18,
                          maxLength: 40,
                        })}px`,
                        color: "var(--hp-heading)",
                        transition: "color 0.2s ease",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--hp-primary)";
                        e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--hp-heading)";
                        e.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      {attendance.firstName} {attendance.lastName}
                    </div>
                    {formattedResponseTime && (
                      <div style={{ marginTop: "2px", fontSize: "12px", color: "var(--hp-muted)" }}>
                        Ответ: {formattedResponseTime}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color:
                      attendance.status === 2
                        ? "var(--hp-success)"
                        : attendance.status === 3
                          ? "var(--hp-danger)"
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
                    backgroundColor: "var(--hp-surface-soft)",
                    borderRadius: "8px",
                    border: "1px solid var(--hp-border)",
                    fontSize: "13px",
                    color: "var(--hp-muted)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "var(--hp-muted)" }}>💬</span>
                  <span style={{ fontStyle: "italic", lineHeight: "1.4" }}>{attendance.notes}</span>
                </div>
              )}
            </div>
          );
        }) || <div style={{ padding: "16px", textAlign: "center", color: "var(--hp-muted)" }}>Нет данных о явке</div>}
      </div>
    </div>
  );
};

