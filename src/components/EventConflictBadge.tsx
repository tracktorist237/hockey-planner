import { useState } from "react";
import { EventConflictDto } from "src/types/events";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });

export function EventConflictBadge({ conflicts }: { conflicts?: EventConflictDto[] }) {
  const [open, setOpen] = useState(false);
  if (!conflicts?.length) return null;

  return <span style={{ position: "relative", display: "inline-flex", maxWidth: "100%" }} onClick={event => event.stopPropagation()}>
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} style={{ border: "1px solid var(--hp-warning-border)", borderRadius: 999, padding: "3px 9px", background: "var(--hp-warning-soft)", color: "var(--hp-warning)", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>
      Пересечение
    </button>
    {open && <span role="dialog" aria-label="Пересекающиеся мероприятия" style={{ position: "absolute", zIndex: 30, top: "calc(100% + 6px)", left: 0, width: "min(320px, calc(100vw - 40px))", display: "grid", gap: 10, padding: 12, border: "1px solid var(--hp-border)", borderRadius: 8, background: "var(--hp-surface)", boxShadow: "var(--hp-shadow-md)", color: "var(--hp-text)", overflowWrap: "anywhere" }}>
      <strong>Пересекается с:</strong>
      {conflicts.map(conflict => {
        const start = new Date(conflict.startTime);
        const end = new Date(start.getTime() + conflict.durationMinutes * 60_000);
        return <span key={conflict.id} style={{ display: "grid", gap: 3 }}>
          <a href={`/events/${conflict.id}`} style={{ color: "var(--hp-primary-text)", fontWeight: 900 }}>{conflict.title}</a>
          <span style={{ color: "var(--hp-muted)", fontSize: 13 }}>{dateFormatter.format(start)} · {timeFormatter.format(start)}–{timeFormatter.format(end)}</span>
        </span>;
      })}
    </span>}
  </span>;
}
