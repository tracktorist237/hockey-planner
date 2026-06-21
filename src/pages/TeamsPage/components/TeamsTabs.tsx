import { TeamsTab } from "src/pages/TeamsPage/types";

interface TeamsTabsProps {
  activeTab: TeamsTab;
  onChange: (tab: TeamsTab) => void;
}

const tabs: Array<{ value: TeamsTab; label: string }> = [
  { value: "my", label: "Мои" },
  { value: "public", label: "Найти" },
  { value: "code", label: "Код" },
  { value: "create", label: "Создать" },
];

export function TeamsTabs({ activeTab, onChange }: TeamsTabsProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, padding: 6, borderRadius: 16, background: "var(--hp-surface-muted)" }}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          style={{
            border: 0,
            borderRadius: 12,
            padding: "11px 6px",
            fontWeight: 900,
            cursor: "pointer",
            background: activeTab === tab.value ? "var(--hp-surface)" : "transparent",
            color: activeTab === tab.value ? "var(--hp-text-strong)" : "var(--hp-muted)",
            boxShadow: activeTab === tab.value ? "var(--hp-shadow-sm)" : "none",
            fontSize: 13,
            transform: activeTab === tab.value ? "scale(1)" : "scale(0.985)",
            transition: "background-color 220ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms ease, box-shadow 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
