import { useMemo, useState } from "react";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { AttendanceLookUpDto } from "src/types/events";
import { getAdaptiveFontSize } from "src/utils/text";

interface AttendanceListProps {
  attendances?: AttendanceLookUpDto[];
  onPlayerClick: (userId: string) => void;
  avatarUrls?: Record<string, string>;
  eventCreatedAt?: string;
  canManage?: boolean;
  currentUserId?: string | null;
  onStatusChange?: (attendance: AttendanceLookUpDto, status: number, notes?: string | null) => Promise<void>;
  onAddGuest?: (guest: {
    firstName: string;
    lastName: string;
    handedness?: number | null;
    jerseyNumber?: number | null;
  }) => Promise<void>;
  embedded?: boolean;
}

const DEFAULT_RESPONSE_TOLERANCE_MS = 5000;

const attendanceStatusOptions = [
  { value: 1, label: "Ожидает" },
  { value: 2, label: "Сможет" },
  { value: 3, label: "Не сможет" },
];

const isSameMoment = (left?: string, right?: string): boolean => {
  if (!left || !right) return false;

  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();

  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return false;

  return Math.abs(leftTime - rightTime) <= DEFAULT_RESPONSE_TOLERANCE_MS;
};

const formatResponseTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const AttendanceList = ({
  attendances,
  onPlayerClick,
  avatarUrls,
  eventCreatedAt,
  canManage = false,
  currentUserId,
  onStatusChange,
  onAddGuest,
  embedded = false,
}: AttendanceListProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingStatuses, setIsEditingStatuses] = useState(false);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestHandedness, setGuestHandedness] = useState("");
  const [guestJerseyNumber, setGuestJerseyNumber] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);

  const editableStatusCount = useMemo(
    () =>
      attendances?.filter(
        (attendance) =>
          canManage ||
          (Boolean(attendance.isGuest) && Boolean(currentUserId) && attendance.invitedByUserId === currentUserId),
      ).length ?? 0,
    [attendances, canManage, currentUserId],
  );

  const canEditAttendance = (attendance: AttendanceLookUpDto): boolean => (
    canManage ||
    (Boolean(attendance.isGuest) && Boolean(currentUserId) && attendance.invitedByUserId === currentUserId)
  );

  const handleStatusChange = async (attendance: AttendanceLookUpDto, status: number) => {
    if (!onStatusChange || status === attendance.status || !canEditAttendance(attendance)) return;

    setSavingUserId(attendance.userId);
    try {
      await onStatusChange(attendance, status, attendance.notes ?? null);
    } finally {
      setSavingUserId(null);
    }
  };

  const handleAddGuest = async () => {
    if (!onAddGuest) return;

    const firstName = guestFirstName.trim();
    const lastName = guestLastName.trim();

    if (!lastName || !firstName) {
      setGuestError("Заполните фамилию и имя гостя");
      return;
    }

    const jerseyNumber = guestJerseyNumber.trim() ? Number(guestJerseyNumber) : null;
    if (jerseyNumber !== null && (!Number.isInteger(jerseyNumber) || jerseyNumber < 0 || jerseyNumber > 99)) {
      setGuestError("Номер джерси должен быть от 0 до 99");
      return;
    }

    setSavingUserId("guest");
    setGuestError(null);
    try {
      await onAddGuest({
        firstName,
        lastName,
        handedness: guestHandedness ? Number(guestHandedness) : null,
        jerseyNumber,
      });
      setGuestFirstName("");
      setGuestLastName("");
      setGuestHandedness("");
      setGuestJerseyNumber("");
      setIsAddingGuest(false);
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : "Не удалось добавить гостя");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--hp-surface)",
        borderRadius: embedded ? 0 : "16px",
        padding: "20px",
        marginBottom: embedded ? 0 : "20px",
        boxShadow: embedded ? "none" : "var(--hp-shadow-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
        <h3
          style={{
            margin: 0,
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

        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            style={{
              width: "36px",
              height: "36px",
              padding: 0,
              border: "1px solid var(--hp-border)",
              borderRadius: "10px",
              backgroundColor: "var(--hp-surface-soft)",
              color: "var(--hp-heading)",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: 900,
              lineHeight: 1,
            }}
            title="Настройки явки"
            aria-label="Настройки явки"
          >
            ⋮
          </button>
          {isMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "42px",
                right: 0,
                zIndex: 20,
                minWidth: "230px",
                padding: "6px",
                border: "1px solid var(--hp-border)",
                borderRadius: "12px",
                backgroundColor: "var(--hp-surface)",
                boxShadow: "var(--hp-shadow-md)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsAddingGuest((value) => !value);
                  setIsMenuOpen(false);
                  setIsEditingStatuses(false);
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  borderRadius: "9px",
                  backgroundColor: "transparent",
                  color: "var(--hp-heading)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 800,
                  textAlign: "left",
                }}
              >
                Добавить гостя
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingStatuses((value) => !value);
                  setIsMenuOpen(false);
                  setIsAddingGuest(false);
                }}
                disabled={editableStatusCount === 0}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  borderRadius: "9px",
                  backgroundColor: "transparent",
                  color: editableStatusCount === 0 ? "var(--hp-muted)" : "var(--hp-heading)",
                  cursor: editableStatusCount === 0 ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: 800,
                  textAlign: "left",
                  opacity: editableStatusCount === 0 ? 0.7 : 1,
                }}
              >
                {isEditingStatuses ? "Скрыть изменение явки" : "Изменить статус явки"}
              </button>
            </div>
          )}
        </div>
      </div>

      {isAddingGuest && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            border: "1px solid var(--hp-border)",
            borderRadius: "12px",
            backgroundColor: "var(--hp-surface-soft)",
            display: "grid",
            gap: "10px",
          }}
        >
          <div style={{ color: "var(--hp-heading)", fontSize: "14px", fontWeight: 900 }}>Гость на это мероприятие</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <input
              value={guestLastName}
              onChange={(event) => setGuestLastName(event.target.value)}
              placeholder="Фамилия"
              style={{ minWidth: 0, padding: "10px 11px", borderRadius: "10px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-input-bg)", color: "var(--hp-text)", fontWeight: 700 }}
            />
            <input
              value={guestFirstName}
              onChange={(event) => setGuestFirstName(event.target.value)}
              placeholder="Имя"
              style={{ minWidth: 0, padding: "10px 11px", borderRadius: "10px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-input-bg)", color: "var(--hp-text)", fontWeight: 700 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <select
              value={guestHandedness}
              onChange={(event) => setGuestHandedness(event.target.value)}
              style={{ minWidth: 0, padding: "10px 11px", borderRadius: "10px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-input-bg)", color: "var(--hp-text)", fontWeight: 700 }}
            >
              <option value="">Хват</option>
              <option value="1">Левый</option>
              <option value="2">Правый</option>
            </select>
            <input
              type="number"
              min={0}
              max={99}
              value={guestJerseyNumber}
              onChange={(event) => setGuestJerseyNumber(event.target.value)}
              placeholder="Номер"
              style={{ minWidth: 0, padding: "10px 11px", borderRadius: "10px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-input-bg)", color: "var(--hp-text)", fontWeight: 700 }}
            />
          </div>
          {guestError && <div style={{ color: "var(--hp-danger)", fontSize: "13px", fontWeight: 800 }}>{guestError}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              type="button"
              onClick={() => {
                setIsAddingGuest(false);
                setGuestError(null);
              }}
              style={{ padding: "11px", borderRadius: "10px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-surface)", color: "var(--hp-text)", fontWeight: 800, cursor: "pointer" }}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => {
                void handleAddGuest();
              }}
              disabled={savingUserId === "guest"}
              style={{ padding: "11px", borderRadius: "10px", border: "none", backgroundColor: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: savingUserId === "guest" ? "wait" : "pointer", opacity: savingUserId === "guest" ? 0.75 : 1 }}
            >
              {savingUserId === "guest" ? "Добавляем..." : "Добавить"}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "var(--hp-muted)" }}>
          <span>Готовы:</span>
          <span style={{ fontWeight: "600", color: "var(--hp-success)" }}>{attendances?.filter((attendance) => attendance.status === 2).length || 0}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", color: "var(--hp-muted)" }}>
          <span>Не готовы:</span>
          <span style={{ fontWeight: "600", color: "var(--hp-danger)" }}>{attendances?.filter((attendance) => attendance.status === 3).length || 0}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--hp-muted)" }}>
          <span>Не ответили:</span>
          <span style={{ fontWeight: "600", color: "var(--hp-warning)" }}>{attendances?.filter((attendance) => attendance.status === 1).length || 0}</span>
        </div>
      </div>

      <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid var(--hp-border)", borderRadius: "10px", padding: "8px" }}>
        {attendances?.map((attendance) => {
          const showResponseTime = Boolean(attendance.respondedAt) && !isSameMoment(attendance.respondedAt, eventCreatedAt);
          const formattedResponseTime = showResponseTime ? formatResponseTime(attendance.respondedAt) : "";
          const canEditThisAttendance = canEditAttendance(attendance);

          return (
            <div
              key={attendance.userId}
              style={{
                padding: "12px",
                borderBottom: "1px solid var(--hp-border)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                cursor: isEditingStatuses || attendance.isGuest ? "default" : "pointer",
                transition: "background-color 0.2s ease",
              }}
              onClick={() => {
                if (!isEditingStatuses && !attendance.isGuest) onPlayerClick(attendance.userId);
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <PlayerAvatar
                    size={32}
                    shape="rounded"
                    photoUrl={attendance.photoUrl ?? avatarUrls?.[attendance.userId]}
                    jerseyNumber={attendance.jerseyNumber}
                    fallbackPrefix={attendance.isGuest ? "" : "#"}
                    badgePrefix="#"
                    fontSize={12}
                    fallbackBg={attendance.status === 2 ? "var(--hp-success-soft)" : attendance.status === 3 ? "var(--hp-danger-soft)" : "var(--hp-warning-soft)"}
                    fallbackColor={attendance.status === 2 ? "var(--hp-success)" : attendance.status === 3 ? "var(--hp-danger)" : "var(--hp-warning)"}
                  />
                  <div style={{ minWidth: 0 }}>
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
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {attendance.firstName} {attendance.lastName}
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      {attendance.isGuest && <span style={{ marginTop: "2px", fontSize: "12px", color: "var(--hp-primary)", fontWeight: 900 }}>Гость</span>}
                      {formattedResponseTime && <span style={{ marginTop: "2px", fontSize: "12px", color: "var(--hp-muted)" }}>Ответ: {formattedResponseTime}</span>}
                    </div>
                  </div>
                </div>

                {isEditingStatuses && canEditThisAttendance ? (
                  <select
                    value={attendance.status}
                    disabled={savingUserId === attendance.userId}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      void handleStatusChange(attendance, Number(event.target.value));
                    }}
                    style={{
                      minWidth: "118px",
                      padding: "8px 10px",
                      border: "1px solid var(--hp-border)",
                      borderRadius: "10px",
                      backgroundColor: "var(--hp-input-bg)",
                      color: "var(--hp-text)",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: savingUserId === attendance.userId ? "wait" : "pointer",
                    }}
                  >
                    {attendanceStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    style={{
                      fontSize: "13px",
                      color: attendance.status === 2 ? "var(--hp-success)" : attendance.status === 3 ? "var(--hp-danger)" : "var(--hp-warning)",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {attendance.status === 2 ? "✓" : attendance.status === 3 ? "×" : "…"}
                  </div>
                )}
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
