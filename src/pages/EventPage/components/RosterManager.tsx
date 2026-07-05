import { useEffect, useMemo, useState } from "react";
import { getUniformColors } from "src/api/uniformColors";
import { AttendanceLookUpDto, EventType, LineDto, UniformColorDto } from "src/types/events";
import { Slot } from "src/pages/EventPage/types";
import { LineCircles } from "src/pages/EventPage/components/LineCircles";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { getAdaptiveFontSize } from "src/utils/text";
import { HandednessBadge } from "src/pages/EventPage/components/HandednessBadge";
import { findDuplicateLastNames, getRosterPlayerName } from "src/pages/EventPage/utils/playerDisplayName";

const ROSTER_HANDEDNESS_STORAGE_KEY = "hp-show-roster-handedness";

interface RosterManagerProps {
  canManage: boolean;
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
  hasUnsavedRosterChanges: boolean;
  savingRoster: boolean;
  rosterSaveError: string | null;
  saveRosterChanges: () => Promise<void>;
  saveLine: () => Promise<void>;
  saveEditedLine: () => Promise<void>;
  deleteLine: (lineId: string) => Promise<void>;
  moveLineUp: (index: number) => Promise<void>;
  moveLineDown: (index: number) => Promise<void>;
  assignLineUniformColor: (lineId: string, uniformColorId: string | null) => Promise<void>;
  startRenameLine: (lineId: string, currentName: string) => void;
  saveRenamedLine: () => Promise<void>;
  startEditLine: (index: number) => void;
  clearSlot: (slot: Slot) => void;
  selectForSlot: (player: AttendanceLookUpDto) => void;
  cancelLineEditor: () => void;
  onPlayerClick: (userId: string) => void;
  avatarUrls?: Record<string, string>;
  eventType: EventType;
  teamId?: string | null;
  attendances?: AttendanceLookUpDto[];
  embedded?: boolean;
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
  showHandedness = false,
  duplicateLastNames = new Set<string>(),
) => {
  const playerDisplayName = lineSlots[slot] ? getRosterPlayerName(lineSlots[slot]!, duplicateLastNames) : "";

  return (
    <div key={slot} style={{ textAlign: "center", width: "70px" }}>
      <div
        onClick={() => setActiveSlot(slot)}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: `2px ${activeSlot === slot ? "solid var(--hp-primary)" : "dashed var(--hp-muted)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
            cursor: "pointer",
          backgroundColor: lineSlots[slot] ? "var(--hp-primary-soft)" : "var(--hp-surface)",
          margin: "0 auto 4px auto",
          fontSize: "20px",
          fontWeight: lineSlots[slot] ? "600" : "400",
          color: lineSlots[slot] ? "var(--hp-heading)" : "var(--hp-muted)",
          transition: "all 0.2s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!lineSlots[slot]) {
            e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
          }
        }}
        onMouseLeave={(e) => {
          if (!lineSlots[slot]) {
            e.currentTarget.style.backgroundColor = "var(--hp-surface)";
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
              fallbackBg="var(--hp-primary-soft)"
              fallbackColor="var(--hp-heading)"
              fontSize={20}
            />
            {showHandedness && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  ...(lineSlots[slot]!.handedness === 2 ? { right: "-4px" } : { left: "-4px" }),
                  zIndex: 7,
                }}
              >
                <HandednessBadge handedness={lineSlots[slot]!.handedness} />
              </span>
            )}
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

      <div style={{ fontSize: "10px", color: "var(--hp-muted)", fontWeight: "500", marginBottom: "4px" }}>{getSlotLabel(slot)}</div>

      {lineSlots[slot] && (
        <>
          <div
            style={{
              fontSize: `${getAdaptiveFontSize(playerDisplayName, {
                base: 11,
                min: 8,
                startShrinkAt: 10,
                maxLength: 24,
              })}px`,
              color: "var(--hp-text)",
              lineHeight: "1.2",
              minHeight: "26px",
              whiteSpace: "nowrap",
              marginBottom: "4px",
              cursor: "pointer",
              transition: "color 0.2s ease",
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!lineSlots[slot]!.isGuest) onPlayerClick(lineSlots[slot]!.userId);
            }}
            onMouseEnter={(e) => {
              if (lineSlots[slot]!.isGuest) return;
              e.currentTarget.style.color = "var(--hp-primary)";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              if (lineSlots[slot]!.isGuest) return;
              e.currentTarget.style.color = "var(--hp-text)";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {playerDisplayName}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearSlot(slot);
            }}
            style={{
              padding: "2px 8px",
              fontSize: "10px",
              backgroundColor: "var(--hp-danger-soft)",
              color: "var(--hp-danger)",
              border: "1px solid var(--hp-danger-border)",
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
  canManage,
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
  hasUnsavedRosterChanges,
  savingRoster,
  rosterSaveError,
  saveRosterChanges,
  saveLine,
  saveEditedLine,
  deleteLine,
  moveLineUp,
  moveLineDown,
  assignLineUniformColor,
  startRenameLine,
  saveRenamedLine,
  startEditLine,
  clearSlot,
  selectForSlot,
  cancelLineEditor,
  onPlayerClick,
  avatarUrls,
  eventType,
  teamId,
  attendances,
  embedded = false,
}: RosterManagerProps) => {
  const [showRosterSettings, setShowRosterSettings] = useState(false);
  const [isRosterMenuOpen, setIsRosterMenuOpen] = useState(false);
  const [showHandedness, setShowHandedness] = useState(() => {
    try {
      return localStorage.getItem(ROSTER_HANDEDNESS_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [uniformColors, setUniformColors] = useState<UniformColorDto[]>([]);
  const [uniformColorsLoading, setUniformColorsLoading] = useState(false);
  const [uniformColorsError, setUniformColorsError] = useState<string | null>(null);
  const canAssignLineUniformColors = canManage && eventType === EventType.Practice && Boolean(teamId);
  const duplicateLastNames = useMemo(() => findDuplicateLastNames(attendances), [attendances]);
  const isLineEditorOpen = editingLineIndex !== null;
  const editingLine = editingLineIndex === null ? null : sortedRoster[editingLineIndex] ?? null;
  const editorTitle = editingLineIndex === null
    ? "Создание нового звена"
    : `Редактирование: ${editingLine?.name || `звено ${editingLineIndex + 1}`}`;

  const handleStartEditLine = (index: number) => {
    if (editingLineIndex === index) {
      cancelLineEditor();
      return;
    }

    startEditLine(index);
  };

  useEffect(() => {
    try {
      localStorage.setItem(ROSTER_HANDEDNESS_STORAGE_KEY, String(showHandedness));
    } catch {
      // Local storage may be unavailable in privacy mode; keep the session setting working.
    }
  }, [showHandedness]);

  useEffect(() => {
    if (!showRosterSettings || !canAssignLineUniformColors || !teamId) {
      return;
    }

    let active = true;
    setUniformColorsLoading(true);
    setUniformColorsError(null);

    void getUniformColors(teamId)
      .then((items) => {
        if (active) setUniformColors(items);
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          setUniformColors([]);
          setUniformColorsError("Не удалось загрузить цвета формы");
        }
      })
      .finally(() => {
        if (active) setUniformColorsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canAssignLineUniformColors, showRosterSettings, teamId]);

  const getLineUniformColorName = (line: LineDto): string | null => {
    return line.uniformColor?.name ?? uniformColors.find((color) => color.id === line.uniformColorId)?.name ?? null;
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3
          style={{
            margin: "0",
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--hp-heading)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🏒</span>
          <span>Состав ({sortedRoster.length})</span>
        </h3>
        <div style={{ display: canManage ? "flex" : "none", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setCreatingLine(true)}
            style={{
              padding: "10px 16px",
              backgroundColor: "var(--hp-primary)",
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
              e.currentTarget.style.backgroundColor = "var(--hp-primary-hover)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--hp-primary)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span>+</span>
            <span>Добавить звено</span>
          </button>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsRosterMenuOpen((prev) => !prev)}
              style={{
                width: "40px",
                height: "40px",
                padding: 0,
                backgroundColor: isRosterMenuOpen ? "var(--hp-primary-soft)" : "var(--hp-surface-soft)",
                color: "var(--hp-heading)",
                border: `1px solid ${isRosterMenuOpen ? "var(--hp-primary)" : "var(--hp-border)"}`,
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: 900,
                lineHeight: 1,
              }}
              title="Настройки отображения состава"
              aria-label="Настройки отображения состава"
              aria-expanded={isRosterMenuOpen}
            >
              ⋮
            </button>
            {isRosterMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  zIndex: 30,
                  width: "230px",
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
                    setShowHandedness((prev) => !prev);
                    setIsRosterMenuOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    background: "transparent",
                    color: "var(--hp-text)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "9px",
                    fontSize: "14px",
                    fontWeight: 600,
                    textAlign: "left",
                  }}
                >
                  <span>🏒 Показывать хват</span>
                  <span style={{ color: showHandedness ? "var(--hp-success)" : "var(--hp-muted)", fontWeight: 900 }}>
                    {showHandedness ? "✓" : "—"}
                  </span>
                </button>
                {canAssignLineUniformColors && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRosterSettings((prev) => !prev);
                      setIsRosterMenuOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "none",
                      borderRadius: "8px",
                      background: "transparent",
                      color: "var(--hp-text)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      fontSize: "14px",
                      fontWeight: 600,
                      textAlign: "left",
                    }}
                  >
                    <span>🎽 Цвет формы по звеньям</span>
                    <span style={{ color: showRosterSettings ? "var(--hp-success)" : "var(--hp-muted)", fontWeight: 900 }}>
                      {showRosterSettings ? "✓" : "—"}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {canManage && (hasUnsavedRosterChanges || rosterSaveError) && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            borderRadius: "12px",
            border: `1px solid ${rosterSaveError ? "var(--hp-danger-border)" : "var(--hp-warning-border)"}`,
            backgroundColor: rosterSaveError ? "var(--hp-danger-soft)" : "var(--hp-warning-soft)",
            display: "grid",
            gap: "10px",
          }}
        >
          <div style={{ color: "var(--hp-warning)", fontSize: "13px", fontWeight: 900 }}>
            Есть несохранённые изменения
          </div>
          {rosterSaveError && (
            <div style={{ color: "var(--hp-danger)", fontSize: "13px", lineHeight: 1.45, fontWeight: 700 }}>
              {rosterSaveError}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              void saveRosterChanges();
            }}
            disabled={savingRoster || !hasUnsavedRosterChanges}
            style={{
              width: "100%",
              padding: "11px 12px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: "var(--hp-primary)",
              color: "white",
              cursor: savingRoster ? "wait" : hasUnsavedRosterChanges ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontWeight: 900,
              opacity: savingRoster || !hasUnsavedRosterChanges ? 0.75 : 1,
            }}
          >
            {savingRoster ? "Сохранение..." : "Сохранить состав"}
          </button>
        </div>
      )}

      {canAssignLineUniformColors && showRosterSettings && (
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <strong style={{ color: "var(--hp-heading)", fontSize: "14px" }}>Цвет формы по звеньям</strong>
            {uniformColorsLoading && <span style={{ color: "var(--hp-muted)", fontSize: "12px" }}>Загрузка...</span>}
          </div>
          {uniformColorsError && <div style={{ color: "var(--hp-danger)", fontSize: "13px", fontWeight: 700 }}>{uniformColorsError}</div>}
          {sortedRoster.length === 0 ? (
            <div style={{ color: "var(--hp-muted)", fontSize: "13px" }}>Сначала создайте звено.</div>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {sortedRoster.map((line) => (
                <label key={line.id} style={{ display: "grid", gridTemplateColumns: "minmax(96px, 0.8fr) minmax(0, 1.2fr)", gap: "8px", alignItems: "center" }}>
                  <span style={{ color: "var(--hp-text)", fontSize: "13px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {line.name ?? `Звено ${line.order}`}
                  </span>
                  <select
                    value={line.uniformColorId ?? ""}
                    disabled={uniformColorsLoading}
                    onChange={(event) => {
                      void assignLineUniformColor(line.id, event.target.value || null);
                    }}
                    style={{
                      width: "100%",
                      minWidth: 0,
                      padding: "9px 10px",
                      border: "1px solid var(--hp-border)",
                      borderRadius: "10px",
                      backgroundColor: "var(--hp-input-bg)",
                      color: "var(--hp-text)",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    <option value="">Без цвета</option>
                    {uniformColors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {canManage && creatingLine && editingLineIndex === null && (
        <div
          style={{
            marginTop: "16px",
            border: "1px solid var(--hp-border)",
            padding: "20px",
            borderRadius: "12px",
            backgroundColor: "var(--hp-surface-soft)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--hp-heading)" }}>
              {editorTitle}
            </h4>
            <button
              onClick={cancelLineEditor}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--hp-border)",
                background: "var(--hp-surface)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
                e.currentTarget.style.borderColor = "var(--hp-danger)";
                e.currentTarget.style.color = "var(--hp-danger)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hp-surface)";
                e.currentTarget.style.borderColor = "var(--hp-border)";
                e.currentTarget.style.color = "inherit";
              }}
            >
              ✕
            </button>
          </div>

          {editingLineIndex === null && (
            <label
              style={{
                display: "grid",
                gap: "6px",
                marginBottom: "16px",
                color: "var(--hp-heading)",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              Название звена
              <input
                type="text"
                value={newLineName}
                onChange={(event) => setNewLineName(event.target.value)}
                placeholder="Например: Первое звено"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "11px 12px",
                  border: "1px solid var(--hp-border)",
                  borderRadius: "10px",
                  backgroundColor: "var(--hp-input-bg)",
                  color: "var(--hp-text)",
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              />
            </label>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "16px", flexWrap: "wrap" }}>
            {(["LW", "C", "RW"] as Slot[]).map((slot) =>
              renderEditableSlot(
                slot,
                lineSlots,
                activeSlot,
                setActiveSlot,
                onPlayerClick,
                clearSlot,
                avatarUrls,
                showHandedness,
                duplicateLastNames,
              ),
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            {(["LD", "RD"] as Slot[]).map((slot) =>
              renderEditableSlot(
                slot,
                lineSlots,
                activeSlot,
                setActiveSlot,
                onPlayerClick,
                clearSlot,
                avatarUrls,
                showHandedness,
                duplicateLastNames,
              ),
            )}
          </div>

          {activeSlot && (
            <div style={{ marginTop: "16px", borderTop: "1px solid var(--hp-border)", paddingTop: "16px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "500", color: "var(--hp-text)" }}>
                Выберите игрока для позиции {getSlotTitle(activeSlot)}
              </h4>
              <div style={{ maxHeight: "min(52vh, 420px)", overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y", border: "1px solid var(--hp-border)", borderRadius: "8px" }}>
                {availablePlayers.length > 0 ? (
                  availablePlayers.map((player) => (
                    <div
                      key={player.userId}
                      style={{
                        padding: "8px 10px",
                        borderBottom: "1px solid var(--hp-border)",
                        cursor: "pointer",
                        backgroundColor: "var(--hp-surface)",
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                      }}
                      onClick={() => selectForSlot(player)}
                    >
                      <PlayerAvatar
                        size={30}
                        shape="rounded"
                        photoUrl={player.photoUrl ?? avatarUrls?.[player.userId]}
                        jerseyNumber={player.jerseyNumber}
                        fallbackPrefix="#"
                        badgePrefix="#"
                        fallbackBg="var(--hp-primary)"
                        fallbackColor="white"
                        fontSize={12}
                        badgeSizePx={13}
                        badgeFontSizePx={8}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", fontSize: "14px", lineHeight: 1.2 }}>
                          {player.firstName} {player.lastName}
                        </div>
                        {showHandedness && (
                          <div style={{ marginTop: "3px" }}>
                            <HandednessBadge handedness={player.handedness} compact />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "24px", textAlign: "center", color: "var(--hp-muted)" }}>Нет доступных игроков</div>
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
              backgroundColor: "var(--hp-success)",
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
              e.currentTarget.style.backgroundColor = "var(--hp-success)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span>{editingLineIndex === null ? "+ Добавить звено" : "✓ Зафиксировать изменения"}</span>
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
              border: "1px solid var(--hp-border)",
              borderRadius: "12px",
              backgroundColor: "var(--hp-surface-soft)",
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
                        border: "1px solid var(--hp-primary)",
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
                        backgroundColor: "var(--hp-success)",
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
                        backgroundColor: "var(--hp-surface-soft)",
                        border: "1px solid var(--hp-border)",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <strong style={{ fontSize: "16px", color: "var(--hp-heading)" }}>{line.name ?? `Звено ${line.order}`}</strong>
                    <button
                      onClick={() => startRenameLine(line.id, line.name || `Звено ${line.order}`)}
                      style={{
                        padding: "6px 8px",
                        backgroundColor: "var(--hp-surface-soft)",
                        border: "1px solid var(--hp-border)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: canManage ? "inline-flex" : "none",
                      }}
                      title="Переименовать"
                    >
                      📝
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: canManage ? "flex" : "none", gap: "4px" }}>
                <button
                  onClick={() => {
                    void moveLineUp(index);
                  }}
                  disabled={index === 0 || isLineEditorOpen}
                  style={{
                    padding: "6px 8px",
                    backgroundColor: index === 0 || isLineEditorOpen ? "var(--hp-surface-soft)" : "var(--hp-primary-soft)",
                    color: index === 0 || isLineEditorOpen ? "#999" : "var(--hp-primary)",
                    border: "none",
                    borderRadius: "6px",
                    cursor: index === 0 || isLineEditorOpen ? "not-allowed" : "pointer",
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
                  disabled={index === sortedRoster.length - 1 || isLineEditorOpen}
                  style={{
                    padding: "6px 8px",
                    backgroundColor: index === sortedRoster.length - 1 || isLineEditorOpen ? "var(--hp-surface-soft)" : "var(--hp-primary-soft)",
                    color: index === sortedRoster.length - 1 || isLineEditorOpen ? "#999" : "var(--hp-primary)",
                    border: "none",
                    borderRadius: "6px",
                    cursor: index === sortedRoster.length - 1 || isLineEditorOpen ? "not-allowed" : "pointer",
                    fontSize: "12px",
                  }}
                  title="Опустить ниже"
                >
                  ⬇
                </button>
              </div>
            </div>

            {getLineUniformColorName(line) && (
              <div style={{ marginBottom: "12px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    padding: "5px 9px",
                    borderRadius: "999px",
                    border: "1px solid var(--hp-border)",
                    backgroundColor: "var(--hp-surface)",
                    color: "var(--hp-muted)",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  Цвет формы: {getLineUniformColorName(line)}
                </span>
              </div>
            )}

            <div style={{ display: canManage ? "flex" : "none", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => handleStartEditLine(index)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: editingLineIndex === index ? "var(--hp-surface)" : "var(--hp-primary)",
                  color: editingLineIndex === index ? "var(--hp-heading)" : "white",
                  border: editingLineIndex === index ? "1px solid var(--hp-border)" : "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {editingLineIndex === index ? "Сбросить" : "Редактировать"}
              </button>

              <button
                onClick={() => {
                  void deleteLine(line.id);
                }}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "var(--hp-danger-soft)",
                  color: "var(--hp-danger)",
                  border: "1px solid var(--hp-danger-border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Удалить
              </button>
            </div>

            {canManage && creatingLine && editingLineIndex === index && (
              <div
                style={{
                  marginTop: "16px",
                  border: "1px solid var(--hp-border)",
                  padding: "20px",
                  borderRadius: "12px",
                  backgroundColor: "var(--hp-surface-soft)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--hp-heading)" }}>
                    {editorTitle}
                  </h4>
                  <button
                    onClick={cancelLineEditor}
                    style={{
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--hp-border)",
                      background: "var(--hp-surface)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "16px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
                      e.currentTarget.style.borderColor = "var(--hp-danger)";
                      e.currentTarget.style.color = "var(--hp-danger)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--hp-surface)";
                      e.currentTarget.style.borderColor = "var(--hp-border)";
                      e.currentTarget.style.color = "inherit";
                    }}
                  >
                    ✕
                  </button>
                </div>

                {editingLineIndex === null && (
                  <label
                    style={{
                      display: "grid",
                      gap: "6px",
                      marginBottom: "16px",
                      color: "var(--hp-heading)",
                      fontSize: "13px",
                      fontWeight: 800,
                    }}
                  >
                    Название звена
                    <input
                      type="text"
                      value={newLineName}
                      onChange={(event) => setNewLineName(event.target.value)}
                      placeholder="Например: Первое звено"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 12px",
                        border: "1px solid var(--hp-border)",
                        borderRadius: "10px",
                        backgroundColor: "var(--hp-input-bg)",
                        color: "var(--hp-text)",
                        fontSize: "15px",
                        fontWeight: 700,
                      }}
                    />
                  </label>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "16px", flexWrap: "wrap" }}>
                  {(["LW", "C", "RW"] as Slot[]).map((slot) =>
                    renderEditableSlot(
                      slot,
                      lineSlots,
                      activeSlot,
                      setActiveSlot,
                      onPlayerClick,
                      clearSlot,
                      avatarUrls,
                      showHandedness,
                      duplicateLastNames,
                    ),
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                  {(["LD", "RD"] as Slot[]).map((slot) =>
                    renderEditableSlot(
                      slot,
                      lineSlots,
                      activeSlot,
                      setActiveSlot,
                      onPlayerClick,
                      clearSlot,
                      avatarUrls,
                      showHandedness,
                      duplicateLastNames,
                    ),
                  )}
                </div>

                {activeSlot && (
                  <div style={{ marginTop: "16px", borderTop: "1px solid var(--hp-border)", paddingTop: "16px" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "500", color: "var(--hp-text)" }}>
                      Выберите игрока для позиции {getSlotTitle(activeSlot)}
                    </h4>
                    <div style={{ maxHeight: "min(52vh, 420px)", overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y", border: "1px solid var(--hp-border)", borderRadius: "8px" }}>
                      {availablePlayers.length > 0 ? (
                        availablePlayers.map((player) => (
                          <div
                            key={player.userId}
                            style={{
                              padding: "8px 10px",
                              borderBottom: "1px solid var(--hp-border)",
                              cursor: "pointer",
                              backgroundColor: "var(--hp-surface)",
                              display: "flex",
                              alignItems: "center",
                              gap: "9px",
                      }}
                      onClick={() => selectForSlot(player)}
                          >
                            <PlayerAvatar
                              size={30}
                              shape="rounded"
                              photoUrl={player.photoUrl ?? avatarUrls?.[player.userId]}
                              jerseyNumber={player.jerseyNumber}
                              fallbackPrefix="#"
                              badgePrefix="#"
                              fallbackBg="var(--hp-primary)"
                              fallbackColor="white"
                              fontSize={12}
                              badgeSizePx={13}
                              badgeFontSizePx={8}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "600", fontSize: "14px", lineHeight: 1.2 }}>
                                {player.firstName} {player.lastName}
                              </div>
                              {showHandedness && (
                                <div style={{ marginTop: "3px" }}>
                                  <HandednessBadge handedness={player.handedness} compact />
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: "24px", textAlign: "center", color: "var(--hp-muted)" }}>Нет доступных игроков</div>
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
                    backgroundColor: "var(--hp-success)",
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
                    e.currentTarget.style.backgroundColor = "var(--hp-success)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span>{editingLineIndex === null ? "+ Добавить звено" : "✓ Зафиксировать изменения"}</span>
                </button>
              </div>
            )}
            {editingLineIndex !== index && (
              <LineCircles
                members={line.members}
                onPlayerClick={onPlayerClick}
                avatarUrls={avatarUrls}
                showHandedness={showHandedness}
                duplicateLastNames={duplicateLastNames}
              />
            )}
          </div>
        ))
      ) : (
        <div
          style={{
            padding: "32px 16px",
            textAlign: "center",
            color: "var(--hp-muted)",
            border: "1px dashed var(--hp-border)",
            borderRadius: "12px",
            backgroundColor: "var(--hp-surface-soft)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>🏒</div>
          <p style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Состав ещё не назначен</p>
          <button
            onClick={() => setCreatingLine(true)}
            style={{
              padding: "12px 24px",
              backgroundColor: "var(--hp-primary)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
              display: canManage ? "inline-block" : "none",
            }}
          >
            Создать первое звено
          </button>
        </div>
      )}
    </div>
  );
};
