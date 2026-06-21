interface HandednessBadgeProps {
  handedness?: number | null;
  compact?: boolean;
}

export const getHandednessName = (handedness?: number | null): string => {
  if (handedness === 1) return "Левый хват";
  if (handedness === 2) return "Правый хват";
  return "Хват не указан";
};

export function HandednessBadge({ handedness, compact = true }: HandednessBadgeProps) {
  const label = handedness === 1 ? "Л" : handedness === 2 ? "П" : "?";
  const color = handedness === 1 ? "var(--hp-primary)" : handedness === 2 ? "var(--hp-success)" : "var(--hp-muted)";
  const background = handedness === 1 ? "var(--hp-primary-soft)" : handedness === 2 ? "var(--hp-success-soft)" : "var(--hp-surface-muted)";

  return (
    <span
      title={getHandednessName(handedness)}
      aria-label={getHandednessName(handedness)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: compact ? 18 : 0,
        height: compact ? 18 : 24,
        padding: compact ? "0 4px" : "0 8px",
        borderRadius: 999,
        border: `1px solid ${color}`,
        backgroundColor: background,
        color,
        fontSize: compact ? 9 : 11,
        fontWeight: 900,
        lineHeight: 1,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
      }}
    >
      {compact ? label : `🏒 ${getHandednessName(handedness)}`}
    </span>
  );
}
