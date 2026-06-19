import { useNavigate } from "react-router-dom";

export type BottomNavTab = "events" | "news" | "teams" | "settings";

interface BottomNavProps {
  activeTab: BottomNavTab;
}

const tabs: Array<{ key: BottomNavTab; label: string; icon: string; route: string }> = [
  { key: "settings", label: "Настройки", icon: "⚙️", route: "/settings" },
  { key: "events", label: "Мероприятия", icon: "🏒", route: "/events" },
  { key: "news", label: "Новости", icon: "📰", route: "/news" },
  { key: "teams", label: "Команды", icon: "👥", route: "/teams" },
];

export function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate();

  return (
    <div
      className="hp-bottom-nav"
      style={{
        position: "fixed",
        bottom: "12px",
        left: "12px",
        right: "12px",
        background: "var(--hp-surface)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: "10px",
        border: "1px solid var(--hp-border)",
        borderRadius: "18px",
        boxShadow: "var(--hp-shadow-md)",
        zIndex: 120,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "6px" }}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.route)}
              style={{
                minWidth: 0,
                padding: "10px 4px",
                border: "none",
                background: isActive
                  ? "linear-gradient(180deg, #2f7bff, #1257cf)"
                  : "var(--hp-surface-soft)",
                borderRadius: "14px",
                cursor: "pointer",
                color: isActive ? "white" : "var(--hp-primary-text)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                fontWeight: isActive ? "700" : "600",
                overflow: "hidden",
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <span style={{ fontSize: "17px", lineHeight: 1 }}>{tab.icon}</span>
              <span
                style={{
                  maxWidth: "100%",
                  fontSize: "clamp(9px, 2.6vw, 12px)",
                  lineHeight: 1.05,
                  textAlign: "center",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
