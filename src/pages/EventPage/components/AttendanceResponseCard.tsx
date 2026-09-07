import { useState } from "react";
import { AttendanceLookUpDto, EventConflictDto } from "src/types/events";

interface AttendanceResponseCardProps {
  myAttendance?: AttendanceLookUpDto;
  attendanceNote: string;
  setAttendanceNote: (value: string) => void;
  showNoteInput: boolean;
  setShowNoteInput: (value: boolean) => void;
  isEditingNote: boolean;
  setIsEditingNote: (value: boolean) => void;
  submitting: boolean;
  handleVote: (status: number, notes?: string | null) => Promise<void>;
  handleAddNote: () => Promise<void>;
  attendanceConflicts: EventConflictDto[];
  confirmAttendanceDespiteConflicts: () => Promise<void>;
  cancelAttendanceConflict: () => void;
}

export const AttendanceResponseCard = ({
  myAttendance,
  attendanceNote,
  setAttendanceNote,
  showNoteInput,
  setShowNoteInput,
  isEditingNote,
  setIsEditingNote,
  submitting,
  handleVote,
  handleAddNote,
  attendanceConflicts,
  confirmAttendanceDespiteConflicts,
  cancelAttendanceConflict,
}: AttendanceResponseCardProps) => {
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

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
          fontSize: "16px",
          fontWeight: "600",
          color: "var(--hp-text)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>🎯</span>
        <span>Твой ответ</span>
      </h3>

      {!myAttendance || myAttendance.status === 1 ? (
        <>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <button
              disabled={submitting}
              onClick={() => {
                void handleVote(2, attendanceNote || null);
              }}
              style={{
                flex: 1,
                minWidth: "140px",
                padding: "14px 16px",
                backgroundColor: "var(--hp-success)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = "#388e3c";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = "var(--hp-success)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span>✅</span>
              <span>Смогу</span>
            </button>
            <button
              disabled={submitting}
              onClick={() => {
                void handleVote(3, attendanceNote || null);
              }}
              style={{
                flex: 1,
                minWidth: "140px",
                padding: "14px 16px",
                backgroundColor: "var(--hp-danger)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = "var(--hp-danger)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = "#f44336";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span>❌</span>
              <span>Не смогу</span>
            </button>
          </div>

          {!showNoteInput ? (
            <button
              onClick={() => setShowNoteInput(true)}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "var(--hp-surface-soft)",
                color: "var(--hp-muted)",
                border: "1px solid var(--hp-border)",
                borderRadius: "10px",
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hp-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
              }}
            >
              <span>💬</span>
              <span>Добавить комментарий</span>
            </button>
          ) : (
            <div style={{ marginTop: "12px", padding: "16px", backgroundColor: "var(--hp-surface-soft)", borderRadius: "12px", border: "1px solid var(--hp-border)" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <button
                  onClick={() => setAttendanceNote("Принесу пиво")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "var(--hp-warning-soft)",
                    color: "var(--hp-warning)",
                    border: "1px solid var(--hp-warning-border)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    flex: 1,
                  }}
                >
                  <span>🍺</span>
                  <span>Принесу пиво</span>
                </button>
                <button
                  onClick={() => setAttendanceNote("После травмы")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "var(--hp-purple-soft)",
                    color: "var(--hp-purple)",
                    border: "1px solid var(--hp-purple-border)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    flex: 1,
                  }}
                >
                  <span>🩹</span>
                  <span>После травмы</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={attendanceNote}
                  onChange={(e) => setAttendanceNote(e.target.value)}
                  placeholder="Введите комментарий..."
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "1px solid var(--hp-border)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    backgroundColor: "var(--hp-surface)",
                  }}
                />
                <button
                  onClick={() => setShowNoteInput(false)}
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "var(--hp-surface-soft)",
                    border: "1px solid var(--hp-border)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div>
          <div
            style={{
              padding: "16px",
              backgroundColor: myAttendance.status === 2 ? "var(--hp-success-soft)" : "var(--hp-danger-soft)",
              color: myAttendance.status === 2 ? "var(--hp-success)" : "var(--hp-danger)",
              borderRadius: "10px",
              marginBottom: "16px",
              border: `1px solid ${myAttendance.status === 2 ? "var(--hp-success-border)" : "var(--hp-danger-border)"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: myAttendance.notes ? "12px" : "0",
              }}
            >
              <div>
                <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "4px" }}>
                  {myAttendance.status === 2 ? "✅ Сможет" : "❌ Не сможет"}
                </div>
                <div style={{ fontSize: "14px", opacity: 0.8 }}>Ваш ответ записан</div>
              </div>

              {!isEditingNote ? (
                <button
                  onClick={() => {
                    setAttendanceNote(myAttendance.notes || "");
                    setIsEditingNote(true);
                  }}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "var(--hp-surface-soft)",
                    border: "1px solid var(--hp-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--hp-surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
                  }}
                >
                  <span>💬</span>
                  <span>{myAttendance.notes ? "Изменить" : "Добавить"}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    void handleAddNote();
                  }}
                  disabled={submitting}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "var(--hp-success)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>💾</span>
                  <span>Сохранить</span>
                </button>
              )}
            </div>

            {myAttendance.notes && !isEditingNote && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "var(--hp-surface-soft)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textAlign: "left",
                }}
              >
                <span>💬</span>
                <span style={{ fontStyle: "italic" }}>{myAttendance.notes}</span>
              </div>
            )}

            {isEditingNote && (
              <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "var(--hp-surface-soft)", borderRadius: "8px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <button
                    onClick={() => setAttendanceNote("Принесу пиво")}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "var(--hp-warning-soft)",
                      color: "var(--hp-warning)",
                      border: "1px solid var(--hp-warning-border)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      flex: 1,
                    }}
                  >
                    <span>🍺</span>
                    <span>Принесу пиво</span>
                  </button>
                  <button
                    onClick={() => setAttendanceNote("После травмы")}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "var(--hp-purple-soft)",
                      color: "var(--hp-purple)",
                      border: "1px solid var(--hp-purple-border)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      flex: 1,
                    }}
                  >
                    <span>🩹</span>
                    <span>После травмы</span>
                  </button>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={attendanceNote}
                    onChange={(e) => setAttendanceNote(e.target.value)}
                    placeholder="Введите комментарий..."
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: "1px solid var(--hp-border)",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "var(--hp-surface)",
                    }}
                  />
                  <button
                    onClick={() => {
                      setIsEditingNote(false);
                      setAttendanceNote(myAttendance.notes || "");
                    }}
                    style={{
                      padding: "10px 14px",
                      backgroundColor: "var(--hp-surface-soft)",
                      border: "1px solid var(--hp-border)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            disabled={submitting}
            onClick={() => {
              setIsCancelConfirmOpen(true);
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "var(--hp-surface-soft)",
              color: "var(--hp-muted)",
              border: "1px solid var(--hp-border)",
              borderRadius: "10px",
              fontSize: "15px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = "var(--hp-border)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            ↩ Отменить ответ
          </button>

          {isCancelConfirmOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Подтверждение отмены ответа"
              onClick={() => {
                if (!submitting) setIsCancelConfirmOpen(false);
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px",
                backgroundColor: "rgba(15, 23, 42, 0.56)",
                backdropFilter: "blur(4px)",
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "100%",
                  maxWidth: "420px",
                  borderRadius: "18px",
                  padding: "20px",
                  backgroundColor: "var(--hp-surface)",
                  border: "1px solid var(--hp-border)",
                  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.32)",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                    backgroundColor: "var(--hp-warning-soft)",
                    color: "var(--hp-warning)",
                    border: "1px solid var(--hp-warning-border)",
                    fontSize: "22px",
                  }}
                >
                  ↩
                </div>
                <h4
                  style={{
                    margin: "0 0 8px",
                    color: "var(--hp-heading)",
                    fontSize: "18px",
                    fontWeight: 900,
                  }}
                >
                  Отменить ответ?
                </h4>
                <p
                  style={{
                    margin: "0 0 18px",
                    color: "var(--hp-muted)",
                    fontSize: "14px",
                    lineHeight: 1.45,
                  }}
                >
                  Ваш текущий ответ по явке будет сброшен. После отмены вы снова будете в списке ожидающих ответа.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setIsCancelConfirmOpen(false)}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid var(--hp-border)",
                      backgroundColor: "var(--hp-surface-soft)",
                      color: "var(--hp-heading)",
                      fontWeight: 900,
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    Оставить
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      void handleVote(1).then(() => setIsCancelConfirmOpen(false));
                    }}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid var(--hp-danger-border)",
                      backgroundColor: "var(--hp-danger-soft)",
                      color: "var(--hp-danger)",
                      fontWeight: 900,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    Отменить ответ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {submitting && (
        <div
          style={{
            textAlign: "center",
            marginTop: "12px",
            color: "var(--hp-muted)",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid var(--hp-border)",
              borderTopColor: "var(--hp-primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          Отправка ответа...
        </div>
      )}
      {attendanceConflicts.length > 0 && (
        <div role="dialog" aria-modal="true" aria-labelledby="attendance-conflict-title" style={{ position: "fixed", inset: 0, zIndex: 750, display: "flex", alignItems: "center", justifyContent: "center", padding: 18, background: "rgba(15, 23, 42, 0.58)" }}>
          <div style={{ width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", borderRadius: 14, padding: 20, background: "var(--hp-surface)", border: "1px solid var(--hp-border)", boxShadow: "var(--hp-shadow-md)" }}>
            <h4 id="attendance-conflict-title" style={{ margin: "0 0 8px", color: "var(--hp-heading)", fontSize: 19 }}>В это время у вас уже есть мероприятие</h4>
            <p style={{ margin: "0 0 14px", color: "var(--hp-muted)" }}>Проверьте расписание перед ответом:</p>
            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              {attendanceConflicts.map(conflict => {
                const start = new Date(conflict.startTime);
                const end = new Date(start.getTime() + conflict.durationMinutes * 60_000);
                const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(start);
                const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });
                return <div key={conflict.id} style={{ padding: 12, border: "1px solid var(--hp-border)", borderRadius: 8, overflowWrap: "anywhere" }}>
                  <a href={`/events/${conflict.id}`} style={{ color: "var(--hp-primary-text)", fontWeight: 900 }}>{conflict.title}</a>
                  {conflict.teamName && <div style={{ color: "var(--hp-muted)", fontSize: 13 }}>{conflict.teamName}</div>}
                  <div style={{ color: "var(--hp-muted)", fontSize: 13 }}>{date} · {time.format(start)}–{time.format(end)}</div>
                </div>;
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              <button type="button" disabled={submitting} onClick={cancelAttendanceConflict} style={{ padding: 12, borderRadius: 8, border: "1px solid var(--hp-border)", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 800 }}>Отмена</button>
              <button type="button" disabled={submitting} onClick={() => void confirmAttendanceDespiteConflicts()} style={{ padding: 12, borderRadius: 8, border: 0, background: "var(--hp-success)", color: "white", fontWeight: 800 }}>Всё равно смогу</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

