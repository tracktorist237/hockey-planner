interface PlayerAvatarProps {
  photoUrl?: string | null;
  jerseyNumber?: number | null;
  size?: number;
  shape?: "rounded" | "circle";
  fallbackBg?: string;
  fallbackColor?: string;
  fallbackPrefix?: string;
  showBadgeWhenPhoto?: boolean;
  badgePrefix?: string;
  fontSize?: number;
  badgeSizePx?: number;
  badgeFontSizePx?: number;
}

export function PlayerAvatar({
  photoUrl,
  jerseyNumber,
  size = 40,
  shape = "rounded",
  fallbackBg = "#1976d2",
  fallbackColor = "#fff",
  fallbackPrefix = "#",
  showBadgeWhenPhoto = true,
  badgePrefix = "#",
  fontSize = 14,
  badgeSizePx,
  badgeFontSizePx,
}: PlayerAvatarProps) {
  const displayNumber = jerseyNumber ?? "?";
  const radius = shape === "circle" ? "50%" : "8px";
  const badgeSize = badgeSizePx ?? Math.max(13, Math.round(size * 0.30));
  const badgeFontSize = badgeFontSizePx ?? Math.max(8, Math.round(size * 0.18));

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: radius,
        overflow: "hidden",
        position: "relative",
        backgroundColor: fallbackBg,
        color: fallbackColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "600",
        fontSize: `${fontSize}px`,
        flexShrink: 0,
      }}
    >
      {photoUrl ? (
        <>
          <img
            src={photoUrl}
            alt="player avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {showBadgeWhenPhoto && (
            <div
              style={{
                position: "absolute",
                right: "1px",
                bottom: "1px",
                minWidth: `${badgeSize}px`,
                height: `${badgeSize}px`,
                padding: "0 3px",
                borderRadius: `${Math.round(badgeSize / 2)}px`,
                backgroundColor: "rgba(20,20,20,0.78)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: `${badgeFontSize}px`,
                fontWeight: "700",
                lineHeight: 1,
                boxSizing: "border-box",
                border: "1px solid rgba(255,255,255,0.9)",
                backdropFilter: "blur(1px)",
              }}
            >
              {badgePrefix}
              {displayNumber}
            </div>
          )}
        </>
      ) : (
        <>
          {fallbackPrefix}
          {displayNumber}
        </>
      )}
    </div>
  );
}
