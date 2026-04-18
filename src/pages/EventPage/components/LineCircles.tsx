import { PlayerLookUpDto } from "src/types/events";
import { PlayerRole } from "src/types/lines";
import { Slot, roleToSlot } from "src/pages/EventPage/types";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { getAdaptiveFontSize } from "src/utils/text";

interface LineCirclesProps {
  members?: PlayerLookUpDto[] | null;
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

export const LineCircles = ({ members, onPlayerClick, avatarUrls }: LineCirclesProps) => {
  const slots: Record<Slot, PlayerLookUpDto | null> = {
    LW: null,
    C: null,
    RW: null,
    LD: null,
    RD: null,
  };

  members?.forEach((player) => {
    const role = player.role as PlayerRole;
    const slot = roleToSlot[role];
    if (slot) {
      slots[slot] = player;
    }
  });

  const renderCircle = (slot: Slot) => (
    <div key={slot} style={{ textAlign: "center", width: "70px" }}>
      <div
        onClick={() => {
          const player = slots[slot];
          if (player) {
            onPlayerClick(player.userId);
          }
        }}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "2px solid #1976d2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#e3f2fd",
          margin: "0 auto 4px auto",
          fontSize: "20px",
          fontWeight: "600",
          color: "#1a237e",
          cursor: slots[slot] ? "pointer" : "default",
          transition: "all 0.2s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (slots[slot]) {
            e.currentTarget.style.backgroundColor = "#bbdefb";
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (slots[slot]) {
            e.currentTarget.style.backgroundColor = "#e3f2fd";
            e.currentTarget.style.transform = "scale(1)";
          }
        }}
      >
        {slots[slot] ? (
          <>
            <PlayerAvatar
              size={56}
              shape="circle"
              photoUrl={slots[slot]!.photoUrl ?? avatarUrls?.[slots[slot]!.userId]}
              jerseyNumber={slots[slot]!.jerseyNumber}
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
              #{slots[slot]!.jerseyNumber ?? "?"}
            </div>
          </>
        ) : (
          <span style={{ color: "#666", opacity: 0.5 }}>—</span>
        )}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "#666",
          fontWeight: "500",
          marginBottom: "4px",
        }}
      >
        {getSlotLabel(slot)}
      </div>
      {slots[slot] && (
        <div
          style={{
            fontSize: `${getAdaptiveFontSize(slots[slot]!.lastName, {
              base: 11,
              min: 8,
              startShrinkAt: 10,
              maxLength: 24,
            })}px`,
            color: "#333",
            lineHeight: "1.2",
            minHeight: "26px",
            whiteSpace: "nowrap",
            cursor: "pointer",
            transition: "color 0.2s ease",
          }}
          onClick={() => onPlayerClick(slots[slot]!.userId)}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#1976d2";
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#333";
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          {slots[slot]!.lastName}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "8px", flexWrap: "wrap" }}>
        {(["LW", "C", "RW"] as Slot[]).map(renderCircle)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap" }}>
        {(["LD", "RD"] as Slot[]).map(renderCircle)}
      </div>
    </div>
  );
};
