import { AttendanceLookUpDto } from "src/types/events";

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
}: AttendanceResponseCardProps) => {
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
              void handleVote(1);
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
    </div>
  );
};

