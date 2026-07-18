import { PlayerLookUpDto } from "src/types/events";
import { PlayerRole } from "src/types/lines";
import { Slot, roleToSlot } from "src/pages/EventPage/types";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { getAdaptiveFontSize } from "src/utils/text";
import { HandednessBadge } from "src/pages/EventPage/components/HandednessBadge";
import { getRosterPlayerName } from "src/pages/EventPage/utils/playerDisplayName";

interface LineCirclesProps {
  members?: PlayerLookUpDto[] | null;
  onPlayerClick: (userId: string) => void;
  onGuestClick?: (guest: PlayerLookUpDto) => void;
  avatarUrls?: Record<string, string>;
  showHandedness?: boolean;
  duplicateLastNames?: Set<string>;
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

export const LineCircles = ({
  members,
  onPlayerClick,
  onGuestClick,
  avatarUrls,
  showHandedness = false,
  duplicateLastNames = new Set<string>(),
}: LineCirclesProps) => {
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

  const renderCircle = (slot: Slot) => {
    const playerDisplayName = slots[slot] ? getRosterPlayerName(slots[slot]!, duplicateLastNames) : "";

    return (
    <div key={slot} style={{ textAlign: "center", width: "70px" }}>
      <div
        onClick={() => {
          const player = slots[slot];
          if (player) {
            if (player.isGuest) {
              onGuestClick?.(player);
            } else {
              onPlayerClick(player.userId);
            }
          }
        }}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "2px solid var(--hp-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--hp-primary-soft)",
          margin: "0 auto 4px auto",
          fontSize: "20px",
          fontWeight: "600",
          color: "var(--hp-heading)",
          cursor: slots[slot] ? "pointer" : "default",
          transition: "all 0.2s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (slots[slot] && !slots[slot]!.isGuest) {
            e.currentTarget.style.backgroundColor = "var(--hp-info-border)";
            e.currentTarget.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (slots[slot] && !slots[slot]!.isGuest) {
            e.currentTarget.style.backgroundColor = "var(--hp-primary-soft)";
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
              fallbackBg="var(--hp-primary-soft)"
              fallbackColor="var(--hp-heading)"
              fontSize={20}
            />
            {showHandedness && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  ...(slots[slot]!.handedness === 2 ? { right: "-4px" } : { left: "-4px" }),
                  zIndex: 7,
                }}
              >
                <HandednessBadge handedness={slots[slot]!.handedness} />
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
              #{slots[slot]!.jerseyNumber ?? "?"}
            </div>
          </>
        ) : (
          <span style={{ color: "var(--hp-muted)", opacity: 0.5 }}>—</span>
        )}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "var(--hp-muted)",
          fontWeight: "500",
          marginBottom: "4px",
        }}
      >
        {getSlotLabel(slot)}
      </div>
      {slots[slot] && (
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
          cursor: "pointer",
            transition: "color 0.2s ease",
          }}
          onClick={() => {
            if (slots[slot]!.isGuest) {
              onGuestClick?.(slots[slot]!);
            } else {
              onPlayerClick(slots[slot]!.userId);
            }
          }}
          onMouseEnter={(e) => {
            if (slots[slot]!.isGuest) return;
            e.currentTarget.style.color = "var(--hp-primary)";
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            if (slots[slot]!.isGuest) return;
            e.currentTarget.style.color = "var(--hp-text)";
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          {playerDisplayName}
        </div>
      )}
    </div>
    );
  };

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

