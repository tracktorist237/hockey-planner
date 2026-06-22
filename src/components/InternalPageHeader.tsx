import { ReactNode } from "react";

interface InternalPageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  action?: ReactNode;
  position?: "sticky" | "fixed" | "static";
  visible?: boolean;
  maxWidth?: number;
  marginBottom?: number | string;
  fullBleedInset?: number;
}

export function InternalPageHeader({
  title,
  subtitle,
  onBack,
  action,
  position = "sticky",
  visible = true,
  maxWidth = 620,
  marginBottom = 0,
  fullBleedInset = 0,
}: InternalPageHeaderProps) {
  const isFixed = position === "fixed";

  return (
    <header
      style={{
        position,
        top: position === "static" ? undefined : 0,
        left: isFixed ? 0 : undefined,
        right: isFixed ? 0 : undefined,
        zIndex: 180,
        width: fullBleedInset ? `calc(100% + ${fullBleedInset * 2}px)` : "100%",
        marginLeft: fullBleedInset ? -fullBleedInset : 0,
        marginRight: fullBleedInset ? -fullBleedInset : 0,
        marginTop: position === "static" && fullBleedInset ? -fullBleedInset : 0,
        marginBottom,
        padding: "max(8px, env(safe-area-inset-top, 8px)) 12px 8px",
        borderBottom: "1px solid var(--hp-border)",
        background: "color-mix(in srgb, var(--hp-surface) 96%, transparent)",
        boxShadow: "var(--hp-shadow-sm)",
        backdropFilter: "blur(10px)",
        boxSizing: "border-box",
        transform: visible ? "translateY(0)" : "translateY(-110%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          minHeight: 40,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "40px minmax(0, 1fr) 40px",
          alignItems: "center",
          gap: 9,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
          style={{
            width: 40,
            height: 40,
            padding: 0,
            border: "1px solid var(--hp-border)",
            borderRadius: 12,
            background: "var(--hp-surface-soft)",
            color: "var(--hp-heading)",
            display: "grid",
            placeItems: "center",
            fontSize: 19,
            lineHeight: 1,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ←
        </button>

        <div style={{ minWidth: 0, textAlign: "left" }}>
          <h1 style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--hp-heading)", fontSize: 18, lineHeight: 1.2, fontWeight: 800 }}>
            {title}
          </h1>
          {subtitle && (
            <div style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--hp-muted)", fontSize: 11, lineHeight: 1.2 }}>
              {subtitle}
            </div>
          )}
        </div>

        <div style={{ width: 40, height: 40, display: "grid", placeItems: "center" }}>
          {action}
        </div>
      </div>
    </header>
  );
}
