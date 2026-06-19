import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createEventTableProtocol,
  getEventTableProtocols,
  getTeamTables,
  updateEventTableProtocol,
} from "src/api/teams";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { EventTableProtocolDto, TeamTableSummaryDto } from "src/types/teams";

interface EventTableProtocolsPanelProps {
  eventId: string;
  teamId?: string | null;
  currentUserId?: string | null;
  canManage: boolean;
  onError?: (message: string) => void;
}

interface DraftRow {
  games: number;
  goals: number;
  assists: number;
}

const numberInputStyle: React.CSSProperties = {
  width: 54,
  border: "1px solid var(--hp-border)",
  borderRadius: 10,
  padding: "8px 6px",
  textAlign: "center",
  fontWeight: 900,
  background: "var(--hp-input-bg)",
  color: "var(--hp-text)",
};

const statCellStyle: React.CSSProperties = {
  padding: "10px 8px",
  borderTop: "1px solid var(--hp-border)",
  textAlign: "right",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const stickyNumberHeaderStyle: React.CSSProperties = {
  padding: "10px 8px",
  color: "var(--hp-muted)",
  fontSize: 12,
  fontWeight: 900,
  textAlign: "right",
  whiteSpace: "nowrap",
  position: "sticky",
  left: 0,
  zIndex: 2,
  background: "var(--hp-surface)",
};

const stickyNumberCellStyle: React.CSSProperties = {
  ...statCellStyle,
  position: "sticky",
  left: 0,
  zIndex: 1,
  background: "var(--hp-surface)",
  color: "var(--hp-muted)",
};

const playerCellContentStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const avatarFrameStyle: React.CSSProperties = {
  borderRadius: 12,
  boxShadow: "rgba(25, 118, 210, 0.25) 0px 3px 8px",
  flexShrink: 0,
};

const formatPointsPerGame = (points: number, games: number) => {
  if (games <= 0) {
    return "0,00";
  }

  return (points / games).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function EventTableProtocolsPanel({ eventId, teamId, currentUserId, canManage, onError }: EventTableProtocolsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [protocols, setProtocols] = useState<EventTableProtocolDto[]>([]);
  const [teamTables, setTeamTables] = useState<TeamTableSummaryDto[]>([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [loading, setLoading] = useState(false);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [creatingProtocol, setCreatingProtocol] = useState(false);
  const [savingProtocol, setSavingProtocol] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const protocol = protocols[0] ?? null;
  const hasProtocol = protocols.length > 0;
  const selectedTable = teamTables.find((table) => table.id === selectedTableId) ?? teamTables[0] ?? null;

  const hasUnsavedChanges = useMemo(() => {
    if (!protocol) {
      return false;
    }

    return protocol.rows.some((row) => {
      const draft = drafts[row.id];
      return Boolean(draft && (draft.games !== row.games || draft.goals !== row.goals || draft.assists !== row.assists));
    });
  }, [drafts, protocol]);

  const hydrateDrafts = (loadedProtocols: EventTableProtocolDto[]) => {
    const nextDrafts: Record<string, DraftRow> = {};
    loadedProtocols.forEach((loadedProtocol) => {
      loadedProtocol.rows.forEach((row) => {
        nextDrafts[row.id] = { games: row.games, goals: row.goals, assists: row.assists };
      });
    });
    setDrafts(nextDrafts);
  };

  const loadProtocols = useCallback(async () => {
    if (!currentUserId) {
      setProtocols([]);
      setDrafts({});
      return;
    }

    setLoading(true);
    try {
      const loaded = await getEventTableProtocols(eventId, currentUserId);
      setProtocols(loaded);
      hydrateDrafts(loaded);
    } catch (requestError) {
      onError?.(requestError instanceof Error ? requestError.message : "Не удалось загрузить протокол.");
      setProtocols([]);
      setDrafts({});
    } finally {
      setLoading(false);
    }
  }, [currentUserId, eventId, onError]);

  const loadTeamTables = useCallback(async () => {
    if (!currentUserId || !teamId || hasProtocol || !canManage) {
      setTeamTables([]);
      return;
    }

    setTablesLoading(true);
    try {
      const loaded = await getTeamTables(teamId, currentUserId);
      setTeamTables(loaded);
      setSelectedTableId((previous) => previous || loaded[0]?.id || "");
    } catch (requestError) {
      onError?.(requestError instanceof Error ? requestError.message : "Не удалось загрузить таблицы команды.");
      setTeamTables([]);
    } finally {
      setTablesLoading(false);
    }
  }, [canManage, currentUserId, hasProtocol, onError, teamId]);

  useEffect(() => {
    void loadProtocols();
  }, [loadProtocols]);

  useEffect(() => {
    if (expanded) {
      void loadTeamTables();
    }
  }, [expanded, loadTeamTables]);

  const changeDraft = (rowId: string, key: keyof DraftRow, value: string) => {
    const row = protocol?.rows.find((item) => item.id === rowId);
    if (!row) {
      return;
    }

    const parsed = Number(value);
    setDrafts((previous) => ({
      ...previous,
      [rowId]: {
        games: previous[rowId]?.games ?? row.games,
        goals: previous[rowId]?.goals ?? row.goals,
        assists: previous[rowId]?.assists ?? row.assists,
        [key]: Number.isFinite(parsed) ? Math.max(0, Math.min(999, parsed)) : 0,
      },
    }));
    setMessage(null);
  };

  const handleCreateProtocol = async () => {
    if (!currentUserId || !selectedTable) {
      return;
    }

    setCreatingProtocol(true);
    setMessage(null);
    try {
      const created = await createEventTableProtocol(eventId, { teamTableId: selectedTable.id }, currentUserId);
      setProtocols([created]);
      hydrateDrafts([created]);
      setTeamTables([]);
      setMessage("Протокол создан.");
    } catch (requestError) {
      onError?.(requestError instanceof Error ? requestError.message : "Не удалось создать протокол.");
    } finally {
      setCreatingProtocol(false);
    }
  };

  const saveProtocolChanges = async () => {
    if (!currentUserId || !protocol || savingProtocol) {
      return;
    }

    setSavingProtocol(true);
    setMessage(null);
    try {
      const updated = await updateEventTableProtocol(eventId, protocol.id, {
        rows: protocol.rows.map((row) => ({
          rowId: row.id,
          games: drafts[row.id]?.games ?? row.games,
          goals: drafts[row.id]?.goals ?? row.goals,
          assists: drafts[row.id]?.assists ?? row.assists,
        })),
      }, currentUserId);
      setProtocols([updated]);
      hydrateDrafts([updated]);
      setMessage("Протокол сохранен.");
    } catch (requestError) {
      onError?.(requestError instanceof Error ? requestError.message : "Не удалось сохранить протокол.");
    } finally {
      setSavingProtocol(false);
    }
  };

  return (
    <section style={{ backgroundColor: "var(--hp-surface)", borderRadius: 16, padding: 16, marginBottom: 20, boxShadow: "var(--hp-shadow-sm)" }}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        style={{
          width: "100%",
          border: 0,
          background: "transparent",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          cursor: "pointer",
          color: "var(--hp-heading)",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 900 }}>
          <span style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.18s ease", fontSize: 16 }}>▶</span>
          <span>Протокол</span>
        </span>
        <span style={{ color: hasProtocol ? "var(--hp-success)" : "var(--hp-muted)", fontSize: 13, fontWeight: 900 }}>
          {hasProtocol ? "создан" : "нет"}
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {message && (
            <div style={{ background: "var(--hp-success-soft)", color: "var(--hp-success)", border: "1px solid var(--hp-success-border)", borderRadius: 14, padding: "12px 14px", fontWeight: 800 }}>
              {message}
            </div>
          )}

          {loading && <LoadingIndicator text="Загружаем протокол..." />}

          {!loading && !hasProtocol && canManage && (
            <div style={{ border: "1px solid var(--hp-info-border)", borderRadius: 14, padding: 12, background: "var(--hp-info-soft)", display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 900, color: "var(--hp-heading)" }}>Создание протокола</div>
              {tablesLoading && <LoadingIndicator text="Загружаем таблицы..." />}
              {!tablesLoading && teamTables.length > 0 ? (
                <>
                  <select
                    value={selectedTableId || selectedTable?.id || ""}
                    onChange={(event) => setSelectedTableId(event.target.value)}
                    style={{ border: "1px solid var(--hp-info-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-input-bg)", color: "var(--hp-text)", fontWeight: 800 }}
                  >
                    {teamTables.map((table) => (
                      <option key={table.id} value={table.id}>{table.name}</option>
                    ))}
                  </select>
                  <div style={{ color: "var(--hp-muted)", fontSize: 13, lineHeight: 1.4 }}>
                    Колонка игр заполнится по явке: “Будет” и “Опоздает” получат 1 игру.
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCreateProtocol()}
                    disabled={creatingProtocol || !selectedTable}
                    style={{ border: 0, borderRadius: 12, padding: "11px 12px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: creatingProtocol ? "wait" : "pointer", opacity: creatingProtocol ? 0.7 : 1 }}
                  >
                    {creatingProtocol ? "Создаем..." : "Создать протокол"}
                  </button>
                </>
              ) : !tablesLoading ? (
                <div style={{ color: "var(--hp-muted)", lineHeight: 1.45 }}>
                  Сначала создайте основную таблицу во вкладке команды.
                </div>
              ) : null}
            </div>
          )}

          {!loading && !hasProtocol && !canManage && (
            <div style={{ border: "1px dashed var(--hp-border)", borderRadius: 14, padding: 14, background: "var(--hp-surface-soft)", color: "var(--hp-muted)" }}>
              Протокол для этого мероприятия пока не создан.
            </div>
          )}

          {!loading && protocol && (
            <>
              {canManage && hasUnsavedChanges && (
                <div style={{ padding: 12, borderRadius: 12, border: "1px solid var(--hp-warning-border)", backgroundColor: "var(--hp-warning-soft)", display: "grid", gap: 10 }}>
                  <div style={{ color: "var(--hp-warning)", fontSize: 13, fontWeight: 900 }}>
                    Есть несохраненные изменения
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveProtocolChanges()}
                    disabled={savingProtocol}
                    style={{ width: "100%", padding: "11px 12px", border: 0, borderRadius: 10, backgroundColor: "var(--hp-primary)", color: "white", cursor: savingProtocol ? "wait" : "pointer", fontSize: 14, fontWeight: 900, opacity: savingProtocol ? 0.75 : 1 }}
                  >
                    {savingProtocol ? "Сохранение..." : "Сохранить протокол"}
                  </button>
                </div>
              )}

              <div style={{ border: "1px solid var(--hp-border)", borderRadius: 14, overflow: "auto", background: "var(--hp-surface)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: canManage ? 620 : 540 }}>
                  <thead>
                    <tr>
                      <th style={stickyNumberHeaderStyle}>№</th>
                      {["Игрок", "Игры", "Голы", "Асисты", "Очки", "О/И"].map((label, index) => (
                        <th key={label} title={label === "О/И" ? "Очки в среднем за игру" : undefined} style={{ padding: "10px 8px", color: "var(--hp-muted)", fontSize: 12, fontWeight: 900, textAlign: index === 0 ? "left" : "right", whiteSpace: "nowrap" }}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {protocol.rows.map((row, index) => {
                      const draft = drafts[row.id] ?? { games: row.games, goals: row.goals, assists: row.assists };
                      const points = draft.goals + draft.assists;
                      return (
                        <tr key={row.id}>
                          <td style={stickyNumberCellStyle}>{index + 1}</td>
                          <td style={{ ...statCellStyle, textAlign: "left", fontWeight: 900, color: "var(--hp-heading)" }}>
                            <div style={playerCellContentStyle}>
                              <div style={avatarFrameStyle}>
                                <PlayerAvatar photoUrl={row.photoUrl} jerseyNumber={row.jerseyNumber} size={48} fontSize={16} badgeSizePx={18} badgeFontSizePx={10} />
                              </div>
                              <span>{row.playerName || "Игрок"}</span>
                            </div>
                          </td>
                          {canManage ? (
                            <>
                              <td style={{ ...statCellStyle, padding: "8px" }}>
                                <input type="number" min={0} max={999} value={draft.games} onChange={(event) => changeDraft(row.id, "games", event.target.value)} style={numberInputStyle} />
                              </td>
                              <td style={{ ...statCellStyle, padding: "8px" }}>
                                <input type="number" min={0} max={999} value={draft.goals} onChange={(event) => changeDraft(row.id, "goals", event.target.value)} style={numberInputStyle} />
                              </td>
                              <td style={{ ...statCellStyle, padding: "8px" }}>
                                <input type="number" min={0} max={999} value={draft.assists} onChange={(event) => changeDraft(row.id, "assists", event.target.value)} style={numberInputStyle} />
                              </td>
                              <td style={{ ...statCellStyle, color: "var(--hp-primary)", fontWeight: 900 }}>{points}</td>
                              <td style={statCellStyle}>{formatPointsPerGame(points, draft.games)}</td>
                            </>
                          ) : (
                            <>
                              <td style={statCellStyle}>{row.games}</td>
                              <td style={statCellStyle}>{row.goals}</td>
                              <td style={statCellStyle}>{row.assists}</td>
                              <td style={{ ...statCellStyle, color: "var(--hp-primary)", fontWeight: 900 }}>{row.points}</td>
                              <td style={statCellStyle}>{formatPointsPerGame(row.points, row.games)}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
