import { BottomNav } from "src/components/BottomNav";
import { NotificationBell } from "src/components/NotificationBell";
import { CurrentPlayerHeader } from "src/CurrentPlayerHeader";
import { useAuth } from "src/hooks/useAuth";

export function NewsPage() {
  const { currentUser } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        color: "var(--hp-text)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--hp-surface)",
          padding: "16px",
          borderBottom: "1px solid var(--hp-border)",
          boxShadow: "var(--hp-shadow-sm)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--hp-heading)" }}>
            Новости
          </h1>
          <NotificationBell currentUserId={currentUser?.id} />
        </div>
        <CurrentPlayerHeader />
      </div>

      <main style={{ padding: "16px", paddingBottom: "120px" }}>
        <section
          style={{
            backgroundColor: "var(--hp-surface)",
            border: "1px solid var(--hp-border)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "var(--hp-shadow-sm)",
            color: "var(--hp-muted)",
            lineHeight: 1.5,
          }}
        >
          Лента новостей появится здесь. Пока это заглушка для новой вкладки.
        </section>
      </main>

      <BottomNav activeTab="news" />
    </div>
  );
}
