import { useNavigate } from "react-router-dom";

export type BottomNavTab = "events" | "calendar" | "teams" | "settings";

interface BottomNavProps {
  activeTab: BottomNavTab;
}

const tabs: Array<{ key: BottomNavTab; label: string; icon: string; route: string }> = [
  { key: "settings", label: "Настройки", icon: "⚙️", route: "/settings" },
  { key: "events", label: "Главная", icon: "🏠", route: "/events" },
  { key: "calendar", label: "Календарь", icon: "🗓️", route: "/calendar" },
  { key: "teams", label: "Команды", icon: "👥", route: "/teams" },
];

export function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "12px",
        left: "12px",
        right: "12px",
        background: "var(--hp-surface)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: "12px",
        border: "1px solid var(--hp-border)",
        borderRadius: "18px",
        boxShadow: "var(--hp-shadow-md)",
        zIndex: 120,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.route)}
              style={{
                padding: "12px 10px",
                border: "none",
                background: isActive
                  ? "linear-gradient(180deg, #2f7bff, #1257cf)"
                  : "var(--hp-surface-soft)",
                borderRadius: "14px",
                fontSize: "12px",
                cursor: "pointer",
                color: isActive ? "white" : "var(--hp-primary-text)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                fontWeight: isActive ? "700" : "600",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <span style={{ fontSize: "18px" }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
