const statuses: Record<number, { label: string; background: string; color: string; border: string }> = {
  3: { label: "Завершён", background: "var(--hp-success-soft)", color: "var(--hp-success)", border: "var(--hp-success-border)" },
  4: { label: "Отменён", background: "var(--hp-danger-soft)", color: "var(--hp-danger)", border: "var(--hp-danger-border)" },
  5: { label: "Перенесён", background: "var(--hp-warning-soft)", color: "var(--hp-warning)", border: "var(--hp-warning-border)" },
};
export function EventStatusBadge({ status }: { status: number }) {
  const meta = statuses[status];
  return meta ? <span style={{ display: "inline-flex", padding: "3px 8px", borderRadius: 8, border: `1px solid ${meta.border}`, background: meta.background, color: meta.color, fontSize: 12, fontWeight: 800 }}>{meta.label}</span> : null;
}
