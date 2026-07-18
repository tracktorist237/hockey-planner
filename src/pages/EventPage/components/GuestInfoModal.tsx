import { PlayerAvatar } from "src/components/PlayerAvatar";

interface GuestInfo {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
  handedness?: number | null;
  invitedByUserId?: string | null;
}

interface GuestInfoModalProps {
  guest: GuestInfo | null;
  inviterName: string | null;
  isLoadingInviter: boolean;
  onClose: () => void;
}

const getHandednessName = (handedness?: number | null): string => {
  if (handedness === 1) return "Левый хват";
  if (handedness === 2) return "Правый хват";
  return "Не указан";
};

export const GuestInfoModal = ({ guest, inviterName, isLoadingInviter, onClose }: GuestInfoModalProps) => {
  if (!guest) return null;

  const guestName = `${guest.lastName ?? ""} ${guest.firstName ?? ""}`.trim() || "Гость";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Информация о госте"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(15, 23, 42, 0.56)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "420px",
          overflow: "hidden",
          border: "1px solid var(--hp-border)",
          borderRadius: "20px",
          backgroundColor: "var(--hp-surface)",
          boxShadow: "var(--hp-shadow-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "18px 20px",
            borderBottom: "1px solid var(--hp-border)",
            backgroundColor: "var(--hp-surface-soft)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <PlayerAvatar
              size={46}
              shape="rounded"
              jerseyNumber={guest.jerseyNumber}
              fallbackPrefix=""
              badgePrefix="#"
              fallbackBg="var(--hp-primary-soft)"
              fallbackColor="var(--hp-primary)"
              fontSize={17}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "var(--hp-muted)", fontSize: "12px", fontWeight: 800, marginBottom: "2px" }}>Гость мероприятия</div>
              <h2 style={{ margin: 0, color: "var(--hp-heading)", fontSize: "20px", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {guestName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            style={{ width: "36px", height: "36px", padding: 0, border: "1px solid var(--hp-border)", borderRadius: "10px", backgroundColor: "var(--hp-surface)", color: "var(--hp-heading)", cursor: "pointer", fontSize: "19px", flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gap: "12px", padding: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <InfoCell label="Номер" value={guest.jerseyNumber === null || guest.jerseyNumber === undefined ? "Не указан" : `#${guest.jerseyNumber}`} />
            <InfoCell label="Хват" value={getHandednessName(guest.handedness)} />
          </div>
          <div style={{ padding: "14px", border: "1px solid var(--hp-border)", borderRadius: "12px", backgroundColor: "var(--hp-surface-soft)" }}>
            <div style={{ color: "var(--hp-muted)", fontSize: "12px", fontWeight: 800, marginBottom: "5px" }}>Пригласил</div>
            <div style={{ color: "var(--hp-heading)", fontSize: "16px", fontWeight: 900 }}>
              {!guest.invitedByUserId ? "Не указан" : isLoadingInviter ? "Загружаем..." : inviterName ?? "Не удалось определить"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 20px 20px" }}>
          <button type="button" onClick={onClose} style={{ padding: "11px 18px", border: "none", borderRadius: "10px", backgroundColor: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: "pointer" }}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoCell = ({ label, value }: { label: string; value: string }) => (
  <div style={{ padding: "12px", border: "1px solid var(--hp-border)", borderRadius: "12px", backgroundColor: "var(--hp-surface-soft)" }}>
    <div style={{ color: "var(--hp-muted)", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>{label}</div>
    <div style={{ color: "var(--hp-heading)", fontSize: "15px", fontWeight: 900 }}>{value}</div>
  </div>
);
