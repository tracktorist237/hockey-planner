import { CSSProperties } from "react";

interface LoadingIndicatorProps {
  text: string;
  block?: boolean;
  style?: CSSProperties;
}

export function LoadingIndicator({ text, block = false, style }: LoadingIndicatorProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: block ? "center" : "flex-start",
        gap: "10px",
        padding: block ? "48px 16px" : 0,
        textAlign: block ? "center" : "left",
        color: "var(--hp-muted)",
        fontSize: block ? "16px" : "14px",
        fontWeight: block ? 500 : 600,
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: block ? "32px" : "18px",
          height: block ? "32px" : "18px",
          border: block ? "3px solid var(--hp-border)" : "2px solid var(--hp-border)",
          borderTopColor: "var(--hp-primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          flexShrink: 0,
        }}
      />
      <span>{text}</span>
    </div>
  );
}
