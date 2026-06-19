import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTeamTable,
  getTeamTable,
  getTeamTables,
  getTablesFeed,
} from "src/api/teams";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import {
  TeamTableDto,
  TeamTableSummaryDto,
  TeamTableTemplateType,
} from "src/types/teams";

interface TeamTablesPanelProps {
  currentUserId?: string | null;
  teamId?: string | null;
  canManageTeam?: boolean;
  onOpenTeam?: (teamId: string) => void;
}

const tableShellStyle: React.CSSProperties = {
  border: "1px solid var(--hp-border)",
  borderRadius: 14,
  overflow: "auto",
  background: "var(--hp-surface)",
};

const headerCellStyle: React.CSSProperties = {
  padding: "10px 8px",
  color: "var(--hp-muted)",
  fontSize: 12,
  fontWeight: 900,
  textAlign: "right",
  whiteSpace: "nowrap",
};

const bodyCellStyle: React.CSSProperties = {
  padding: "10px 8px",
  borderTop: "1px solid var(--hp-border)",
  textAlign: "right",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const stickyNumberHeaderStyle: React.CSSProperties = {
  ...headerCellStyle,
  position: "sticky",
  left: 0,
  zIndex: 2,
  background: "var(--hp-surface)",
};

const stickyNumberCellStyle: React.CSSProperties = {
  ...bodyCellStyle,
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

export function TeamTablesPanel({ currentUserId, teamId, canManageTeam, onOpenTeam }: TeamTablesPanelProps) {
  const [tables, setTables] = useState<TeamTableSummaryDto[]>([]);
  const [selectedTable, setSelectedTable] = useState<TeamTableDto | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tableName, setTableName] = useState("Статистика игроков");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canCreate = Boolean(teamId && canManageTeam);

  const loadTables = useCallback(async () => {
    if (!currentUserId) {
      setTables([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const loaded = teamId
        ? await getTeamTables(teamId, currentUserId)
        : await getTablesFeed(currentUserId);
      setTables(loaded);
      setSelectedTableId((previous) => previous ?? loaded[0]?.id ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить таблицы.");
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, teamId]);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  useEffect(() => {
    if (!currentUserId || !selectedTableId) {
      setSelectedTable(null);
      return;
    }

    const summary = tables.find((value) => value.id === selectedTableId);
    if (!summary) {
      setSelectedTable(null);
      return;
    }

    let isMounted = true;
    setTableLoading(true);
    setError(null);
    void getTeamTable(summary.teamId, summary.id, currentUserId)
      .then((table) => {
        if (isMounted) {
          setSelectedTable(table);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : "Не удалось открыть таблицу.");
          setSelectedTable(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setTableLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUserId, selectedTableId, tables]);

  const selectedSummary = useMemo(
    () => tables.find((value) => value.id === selectedTableId) ?? null,
    [selectedTableId, tables],
  );

  const handleCreate = async () => {
    if (!currentUserId || !teamId) {
      return;
    }

    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const created = await createTeamTable(teamId, {
        name: tableName.trim() || "Статистика игроков",
        templateType: TeamTableTemplateType.PlayerStats,
      }, currentUserId);
      await loadTables();
      setSelectedTableId(created.id);
      setSelectedTable(created);
      setTableName("Статистика игроков");
      setCreateOpen(false);
      setMessage("Таблица создана.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось создать таблицу.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {error && (
        <div style={{ background: "var(--hp-danger-soft)", color: "var(--hp-danger)", border: "1px solid var(--hp-danger-border)", borderRadius: 14, padding: "12px 14px", fontWeight: 800 }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ background: "var(--hp-success-soft)", color: "var(--hp-success)", border: "1px solid var(--hp-success-border)", borderRadius: 14, padding: "12px 14px", fontWeight: 800 }}>
          {message}
        </div>
      )}

      {canCreate && (
        <>
          {!createOpen && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              style={{ border: 0, borderRadius: 14, padding: "12px 14px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: "pointer" }}
            >
              Создать таблицу
            </button>
          )}

          {createOpen && (
            <section style={{ border: "1px solid var(--hp-info-border)", borderRadius: 16, padding: 12, background: "var(--hp-info-soft)", display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ fontWeight: 900, color: "var(--hp-heading)" }}>Новая таблица</div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  style={{ border: "1px solid var(--hp-border)", borderRadius: 10, padding: "7px 9px", background: "var(--hp-surface)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ color: "var(--hp-muted)", fontSize: 12, fontWeight: 900 }}>1. Шаблон</div>
                <button
                  type="button"
                  aria-pressed="true"
                  style={{ border: "1px solid var(--hp-primary)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface)", color: "var(--hp-primary-text)", fontWeight: 900, textAlign: "left", cursor: "default" }}
                >
                  Игрок / Игры / Голы / Асисты / Очки / О/И
                </button>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ color: "var(--hp-muted)", fontSize: 12, fontWeight: 900 }}>2. Настройки</div>
                <div style={{ border: "1px solid var(--hp-info-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface)", color: "var(--hp-text)", lineHeight: 1.4 }}>
                  Все участники команды будут добавлены в таблицу автоматически. Очки считаются как голы + асисты.
                </div>
              </div>

              <label style={{ display: "grid", gap: 6, color: "var(--hp-muted)", fontSize: 12, fontWeight: 900 }}>
                3. Название
                <input
                  value={tableName}
                  onChange={(event) => setTableName(event.target.value)}
                  maxLength={120}
                  style={{ border: "1px solid var(--hp-info-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-input-bg)", color: "var(--hp-text)", fontWeight: 800 }}
                />
              </label>

              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                style={{ border: 0, borderRadius: 12, padding: "11px 12px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: creating ? "wait" : "pointer", opacity: creating ? 0.7 : 1 }}
              >
                {creating ? "Создаем..." : "Создать"}
              </button>
            </section>
          )}
        </>
      )}

      {loading && <LoadingIndicator text="Загружаем таблицы..." />}

      {!loading && tables.length === 0 && (
        <div style={{ border: "1px dashed var(--hp-border)", borderRadius: 16, padding: 16, color: "var(--hp-muted)", background: "var(--hp-surface-soft)", lineHeight: 1.45 }}>
          Таблиц пока нет.
        </div>
      )}

      {!loading && tables.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {tables.map((table) => (
            <button
              key={table.id}
              type="button"
              onClick={() => setSelectedTableId(table.id)}
              style={{
                border: selectedTableId === table.id ? "1px solid var(--hp-primary)" : "1px solid var(--hp-border)",
                borderRadius: 12,
                padding: "9px 11px",
                background: selectedTableId === table.id ? "var(--hp-primary-soft)" : "var(--hp-surface)",
                color: selectedTableId === table.id ? "var(--hp-primary-text)" : "var(--hp-heading)",
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {table.name}
            </button>
          ))}
        </div>
      )}

      {selectedSummary && !teamId && (
        <button
          type="button"
          onClick={() => onOpenTeam?.(selectedSummary.teamId)}
          style={{ justifySelf: "start", border: 0, background: "transparent", padding: 0, color: "var(--hp-primary)", fontWeight: 900, cursor: "pointer" }}
        >
          {selectedSummary.teamName}
        </button>
      )}

      {tableLoading && <LoadingIndicator text="Открываем таблицу..." />}

      {!tableLoading && selectedTable && (
        <div style={tableShellStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 540 }}>
            <thead>
              <tr>
                <th style={stickyNumberHeaderStyle}>№</th>
                <th style={{ ...headerCellStyle, textAlign: "left" }}>Игрок</th>
                <th style={headerCellStyle}>Игры</th>
                <th style={headerCellStyle}>Голы</th>
                <th style={headerCellStyle}>Асисты</th>
                <th style={headerCellStyle}>Очки</th>
                <th style={headerCellStyle} title="Очки в среднем за игру">О/И</th>
              </tr>
            </thead>
            <tbody>
              {selectedTable.rows.map((row, index) => (
                <tr key={row.id}>
                  <td style={stickyNumberCellStyle}>{index + 1}</td>
                  <td style={{ ...bodyCellStyle, textAlign: "left", color: "var(--hp-heading)" }}>
                    <div style={playerCellContentStyle}>
                      <div style={avatarFrameStyle}>
                        <PlayerAvatar photoUrl={row.photoUrl} jerseyNumber={row.jerseyNumber} size={48} fontSize={16} badgeSizePx={18} badgeFontSizePx={10} />
                      </div>
                      <span>{row.playerName || "Игрок"}</span>
                    </div>
                  </td>
                  <td style={bodyCellStyle}>{row.games}</td>
                  <td style={bodyCellStyle}>{row.goals}</td>
                  <td style={bodyCellStyle}>{row.assists}</td>
                  <td style={{ ...bodyCellStyle, color: "var(--hp-primary)" }}>{row.points}</td>
                  <td style={bodyCellStyle}>{formatPointsPerGame(row.points, row.games)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
