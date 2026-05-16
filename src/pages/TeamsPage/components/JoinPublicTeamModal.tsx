import { TeamDto } from "src/types/teams";

interface JoinPublicTeamModalProps {
  team: TeamDto;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function JoinPublicTeamModal({ team, loading, onCancel, onConfirm }: JoinPublicTeamModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.48)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "white",
          borderRadius: 22,
          padding: 20,
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.24)",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 900, color: "#2563eb", textTransform: "uppercase", letterSpacing: 0.6 }}>
          Подтверждение
        </div>
        <h2 style={{ margin: "8px 0 8px", color: "#0f172a", fontSize: 24 }}>Вступить в команду?</h2>
        <p style={{ margin: "0 0 14px", color: "#475569", lineHeight: 1.5 }}>
          Вы ещё не состоите в команде <strong>{team.name}</strong>. После вступления она появится в разделе "Мои команды" и в фильтре мероприятий.
        </p>
        <div style={{ padding: 12, borderRadius: 14, background: "#eff6ff", color: "#1e3a8a", fontWeight: 700, lineHeight: 1.45, marginBottom: 14 }}>
          Это действие не просто выбирает фильтр, а добавляет вас в команду.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 14,
              padding: "13px 12px",
              background: "white",
              color: "#334155",
              fontWeight: 800,
              cursor: loading ? "default" : "pointer",
            }}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              border: 0,
              borderRadius: 14,
              padding: "13px 12px",
              background: "#2563eb",
              color: "white",
              fontWeight: 900,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.72 : 1,
            }}
          >
            {loading ? "Вступаем..." : "Вступить"}
          </button>
        </div>
      </div>
    </div>
  );
}
