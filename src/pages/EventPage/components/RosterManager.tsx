import { AttendanceLookUpDto, LineDto } from "src/types/events";
import { Slot } from "src/pages/EventPage/types";
import { LineCircles } from "src/pages/EventPage/components/LineCircles";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { getAdaptiveFontSize } from "src/utils/text";

interface RosterManagerProps {
  sortedRoster: LineDto[];
  creatingLine: boolean;
  setCreatingLine: (value: boolean) => void;
  editingLineIndex: number | null;
  lineSlots: Record<Slot, AttendanceLookUpDto | null>;
  activeSlot: Slot | null;
  setActiveSlot: (slot: Slot | null) => void;
  renamingLineId: string | null;
  setRenamingLineId: (value: string | null) => void;
  newLineName: string;
  setNewLineName: (value: string) => void;
  availablePlayers: AttendanceLookUpDto[];
  saveLine: () => Promise<void>;
  saveEditedLine: () => Promise<void>;
  deleteLine: (lineId: string) => Promise<void>;
  moveLineUp: (index: number) => Promise<void>;
  moveLineDown: (index: number) => Promise<void>;
  startRenameLine: (lineId: string, currentName: string) => void;
  saveRenamedLine: () => Promise<void>;
  startEditLine: (index: number) => void;
  clearSlot: (slot: Slot) => void;
  selectForSlot: (player: AttendanceLookUpDto) => void;
  cancelLineEditor: () => void;
  onPlayerClick: (userId: string) => void;
  avatarUrls?: Record<string, string>;
}

const getSlotLabel = (slot: Slot): string => {
  switch (slot) {
    case "LW":
      return "ЛН";
    case "C":
      return "ЦН";
    case "RW":
      return "ПН";
    case "LD":
      return "ЛЗ";
    case "RD":
      return "ПЗ";
    default:
      return slot;
  }
};

const getSlotTitle = (slot: Slot): string => {
  switch (slot) {
    case "LW":
      return "Левый нападающий";
    case "C":
      return "Центральный нападающий";
    case "RW":
      return "Правый нападающий";
    case "LD":
      return "Левый защитник";
    case "RD":
      return "Правый защитник";
    default:
      return slot;
  }
};

const renderEditableSlot = (
  slot: Slot,
  lineSlots: Record<Slot, AttendanceLookUpDto | null>,
  activeSlot: Slot | null,
  setActiveSlot: (slot: Slot | null) => void,
  onPlayerClick: (userId: string) => void,
  clearSlot: (slot: Slot) => void,
  avatarUrls?: Record<string, string>,
) => {
  return (
    <div key={slot} style={{ textAlign: "center", width: "70px" }}>
      <div
        onClick={() => setActiveSlot(slot)}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: `2px ${activeSlot === slot ? "solid #1976d2" : "dashed #666"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backgroundColor: lineSlots[slot] ? "#e3f2fd" : "#fff",
          margin: "0 auto 4px auto",
          fontSize: "20px",
          fontWeight: lineSlots[slot] ? "600" : "400",
          color: lineSlots[slot] ? "#1a237e" : "#666",
          transition: "all 0.2s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!lineSlots[slot]) {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
          }
        }}
        onMouseLeave={(e) => {
          if (!lineSlots[slot]) {
            e.currentTarget.style.backgroundColor = "#fff";
          }
        }}
      >
        {lineSlots[slot] ? (
          <>
            <PlayerAvatar
              size={56}
              shape="circle"
              photoUrl={lineSlots[slot]!.photoUrl ?? avatarUrls?.[lineSlots[slot]!.userId]}
              jerseyNumber={lineSlots[slot]!.jerseyNumber}
              fallbackPrefix=""
              showBadgeWhenPhoto={false}
              fallbackBg="#e3f2fd"
              fallbackColor="#1a237e"
              fontSize={20}
            />
            <div
              style={{
                position: "absolute",
                right: "-2px",
                bottom: "-2px",
                minWidth: "16px",
                height: "16px",
                padding: "0 3px",
                borderRadius: "9px",
                backgroundColor: "rgba(20,20,20,0.82)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: "700",
                lineHeight: 1,
                zIndex: 6,
                boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
              }}
            >
              #{lineSlots[slot]!.jerseyNumber ?? "?"}
            </div>
          </>
        ) : (
          <span style={{ opacity: 0.7 }}>＋</span>
        )}
      </div>

      <div style={{ fontSize: "10px", color: "#666", fontWeight: "500", marginBottom: "4px" }}>{getSlotLabel(slot)}</div>

      {lineSlots[slot] && (
        <>
          <div
            style={{
              fontSize: `${getAdaptiveFontSize(lineSlots[slot]!.lastName, {
                base: 11,
                min: 8,
                startShrinkAt: 10,
                maxLength: 24,
              })}px`,
              color: "#333",
              lineHeight: "1.2",
              minHeight: "26px",
              whiteSpace: "nowrap",
              marginBottom: "4px",
              cursor: "pointer",
              transition: "color 0.2s ease",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPlayerClick(lineSlots[slot]!.userId);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#1976d2";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#333";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {lineSlots[slot]!.lastName}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearSlot(slot);
            }}
            style={{
              padding: "2px 8px",
              fontSize: "10px",
              backgroundColor: "#ffebee",
              color: "#d32f2f",
              border: "1px solid #ffcdd2",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Убрать
          </button>
        </>
      )}
    </div>
  );
};

export const RosterManager = ({
  sortedRoster,
  creatingLine,
  setCreatingLine,
  editingLineIndex,
  lineSlots,
  activeSlot,
  setActiveSlot,
  renamingLineId,
  setRenamingLineId,
  newLineName,
  setNewLineName,
  availablePlayers,
  saveLine,
  saveEditedLine,
  deleteLine,
  moveLineUp,
  moveLineDown,
  startRenameLine,
  saveRenamedLine,
  startEditLine,
  clearSlot,
  selectForSlot,
  cancelLineEditor,
  onPlayerClick,
  avatarUrls,
}: RosterManagerProps) => {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3
          style={{
            margin: "0",
            fontSize: "18px",
            fontWeight: "600",
            color: "#1a237e",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🏒</span>
          <span>Состав ({sortedRoster.length})</span>
        </h3>
        <button
          onClick={() => setCreatingLine(true)}
          style={{
            padding: "10px 16px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1565c0";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#1976d2";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span>+</span>
          <span>Добавить звено</span>
        </button>
      </div>

      {creatingLine && (
        <div
          style={{
            marginTop: "16px",
            border: "1px solid #e0e0e0",
            padding: "20px",
            borderRadius: "12px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1a237e" }}>
              {editingLineIndex === null ? "Создание нового звена" : `Редактирование звена ${editingLineIndex + 1}`}
            </h4>
            <button
              onClick={cancelLineEditor}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e0e0e0",
                background: "white",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
                e.currentTarget.style.borderColor = "#d32f2f";
                e.currentTarget.style.color = "#d32f2f";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#e0e0e0";
                e.currentTarget.style.color = "inherit";
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "16px", flexWrap: "wrap" }}>
            {(["LW", "C", "RW"] as Slot[]).map((slot) =>
              renderEditableSlot(slot, lineSlots, activeSlot, setActiveSlot, onPlayerClick, clearSlot, avatarUrls),
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            {(["LD", "RD"] as Slot[]).map((slot) =>
              renderEditableSlot(slot, lineSlots, activeSlot, setActiveSlot, onPlayerClick, clearSlot, avatarUrls),
            )}
          </div>

          {activeSlot && (
            <div style={{ marginTop: "16px", borderTop: "1px solid #e0e0e0", paddingTop: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "500", color: "#333" }}>
                Выберите игрока для позиции {getSlotTitle(activeSlot)}
              </h4>
              <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
                {availablePlayers.length > 0 ? (
                  availablePlayers.map((player) => (
                    <div
                      key={player.userId}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                      onClick={() => selectForSlot(player)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#fff";
                      }}
                    >
                      <PlayerAvatar
                        size={36}
                        shape="rounded"
                        photoUrl={player.photoUrl ?? avatarUrls?.[player.userId]}
                        jerseyNumber={player.jerseyNumber}
                        fallbackPrefix="#"
                        badgePrefix="#"
                        fallbackBg="#1976d2"
                        fallbackColor="#fff"
                        fontSize={13}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "500", fontSize: "15px" }}>
                          {player.firstName} {player.lastName}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "24px", textAlign: "center", color: "#666" }}>Нет доступных игроков</div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              void (editingLineIndex === null ? saveLine() : saveEditedLine());
            }}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "16px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#388e3c";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4caf50";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span>💾</span>
            <span>{editingLineIndex === null ? "Добавить звено" : "Сохранить изменения"}</span>
          </button>
        </div>
      )}

      {sortedRoster.length > 0 ? (
        sortedRoster.map((line, index) => (
          <div
            key={line.id}
            style={{
              marginTop: "20px",
              padding: "16px",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              backgroundColor: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {renamingLineId === line.id ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1 }}>
                    <input
                      type="text"
                      value={newLineName}
                      onChange={(e) => setNewLineName(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #1976d2",
                        borderRadius: "8px",
                        fontSize: "15px",
                        flex: 1,
                        minWidth: "120px",
                      }}
                      placeholder="Название звена"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          void saveRenamedLine();
                        }
                        if (e.key === "Escape") {
                          setRenamingLineId(null);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        void saveRenamedLine();
                      }}
                      style={{
                        padding: "8px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      💾
                    </button>
                    <button
                      onClick={() => setRenamingLineId(null)}
                      style={{
                        padding: "8px",
                        backgroundColor: "#f5f5f5",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <strong style={{ fontSize: "16px", color: "#1a237e" }}>{line.name ?? `Звено ${line.order}`}</strong>
                    <button
                      onClick={() => startRenameLine(line.id, line.name || `Звено ${line.order}`)}
                      style={{
                        padding: "6px 8px",
                        backgroundColor: "#f5f5f5",
                        border: "1px solid #e0e0e0",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                      title="Переименовать"
                    >
                      📝
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => {
                    void moveLineUp(index);
                  }}
                  disabled={index === 0}
                  style={{
                    padding: "6px 8px",
                    backgroundColor: index === 0 ? "#f5f5f5" : "#e3f2fd",
                    color: index === 0 ? "#999" : "#1976d2",
                    border: "none",
                    borderRadius: "6px",
                    cursor: index === 0 ? "not-allowed" : "pointer",
                    fontSize: "12px",
                  }}
                  title="Поднять выше"
                >
                  ⬆
                </button>
                <button
                  onClick={() => {
                    void moveLineDown(index);
                  }}
                  disabled={index === sortedRoster.length - 1}
                  style={{
                    padding: "6px 8px",
                    backgroundColor: index === sortedRoster.length - 1 ? "#f5f5f5" : "#e3f2fd",
                    color: index === sortedRoster.length - 1 ? "#999" : "#1976d2",
                    border: "none",
                    borderRadius: "6px",
                    cursor: index === sortedRoster.length - 1 ? "not-allowed" : "pointer",
                    fontSize: "12px",
                  }}
                  title="Опустить ниже"
                >
                  ⬇
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => startEditLine(index)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ✏ Редактировать
              </button>

              <button
                onClick={() => {
                  void deleteLine(line.id);
                }}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#ffebee",
                  color: "#d32f2f",
                  border: "1px solid #ffcdd2",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                🗑 Удалить
              </button>
            </div>

            <LineCircles
              members={line.members}
              onPlayerClick={onPlayerClick}
              avatarUrls={avatarUrls}
            />
          </div>
        ))
      ) : (
        <div
          style={{
            padding: "32px 16px",
            textAlign: "center",
            color: "#666",
            border: "1px dashed #e0e0e0",
            borderRadius: "12px",
            backgroundColor: "#fafafa",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>🏒</div>
          <p style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Состав ещё не назначен</p>
          <button
            onClick={() => setCreatingLine(true)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Создать первое звено
          </button>
        </div>
      )}
    </div>
  );
};
