import { PlayerLookUpDto } from "src/types/events";
import { PlayerRole } from "src/types/lines";
import { Slot, roleToSlot } from "src/pages/EventPage/types";

interface LineCirclesProps {
  members?: PlayerLookUpDto[] | null;
  onPlayerClick: (userId: string) => void;
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

export const LineCircles = ({ members, onPlayerClick }: LineCirclesProps) => {
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
        {slots[slot] ? slots[slot]!.jerseyNumber ?? "?" : <span style={{ color: "#666", opacity: 0.5 }}>—</span>}
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
            fontSize: "11px",
            color: "#333",
            lineHeight: "1.2",
            height: "26px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
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
