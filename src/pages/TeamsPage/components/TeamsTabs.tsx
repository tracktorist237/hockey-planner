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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, padding: 6, borderRadius: 16, background: "#e2e8f0" }}>
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
            background: activeTab === tab.value ? "white" : "transparent",
            color: activeTab === tab.value ? "#0f172a" : "#475569",
            boxShadow: activeTab === tab.value ? "0 6px 18px rgba(15, 23, 42, 0.12)" : "none",
            fontSize: 13,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
