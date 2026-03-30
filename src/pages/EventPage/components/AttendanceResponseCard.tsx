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
                backgroundColor: "#4caf50",
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
                  e.currentTarget.style.backgroundColor = "#4caf50";
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
                backgroundColor: "#f44336",
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
                  e.currentTarget.style.backgroundColor = "#d32f2f";
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
                backgroundColor: "#f5f5f5",
                color: "#666",
                border: "1px solid #e0e0e0",
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
                e.currentTarget.style.backgroundColor = "#e0e0e0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
            >
              <span>💬</span>
              <span>Добавить комментарий</span>
            </button>
          ) : (
            <div style={{ marginTop: "12px", padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "12px", border: "1px solid #e0e0e0" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <button
                  onClick={() => setAttendanceNote("Принесу пиво")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#fff3e0",
                    color: "#ef6c00",
                    border: "1px solid #ffe0b2",
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
                    backgroundColor: "#e8eaf6",
                    color: "#3949ab",
                    border: "1px solid #c5cae9",
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
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "15px",
                    backgroundColor: "white",
                  }}
                />
                <button
                  onClick={() => setShowNoteInput(false)}
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#f5f5f5",
                    border: "1px solid #e0e0e0",
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
              backgroundColor: myAttendance.status === 2 ? "#e8f5e9" : "#ffebee",
              color: myAttendance.status === 2 ? "#2e7d32" : "#c62828",
              borderRadius: "10px",
              marginBottom: "16px",
              border: `1px solid ${myAttendance.status === 2 ? "#c8e6c9" : "#ffcdd2"}`,
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
                    backgroundColor: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.8)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.5)";
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
                    backgroundColor: "#4caf50",
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
                  backgroundColor: "rgba(255,255,255,0.5)",
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
              <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "rgba(255,255,255,0.5)", borderRadius: "8px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <button
                    onClick={() => setAttendanceNote("Принесу пиво")}
                    style={{
                      padding: "6px 10px",
                      backgroundColor: "#fff3e0",
                      color: "#ef6c00",
                      border: "1px solid #ffe0b2",
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
                      backgroundColor: "#e8eaf6",
                      color: "#3949ab",
                      border: "1px solid #c5cae9",
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
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      backgroundColor: "white",
                    }}
                  />
                  <button
                    onClick={() => {
                      setIsEditingNote(false);
                      setAttendanceNote(myAttendance.notes || "");
                    }}
                    style={{
                      padding: "10px 14px",
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #e0e0e0",
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
              backgroundColor: "#f5f5f5",
              color: "#666",
              border: "1px solid #e0e0e0",
              borderRadius: "10px",
              fontSize: "15px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = "#e0e0e0";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
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
            color: "#666",
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
              border: "2px solid #e0e0e0",
              borderTopColor: "#1976d2",
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
