import React from "react";

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Application crashed:", error);
  }

  private reload = () => {
    window.location.reload();
  };

  private clearCacheAndReload = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }

      const registrations = await navigator.serviceWorker?.getRegistrations?.();
      await Promise.all((registrations ?? []).map((registration) => registration.update()));
    } catch (error) {
      console.warn("Failed to clear app cache:", error);
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
          boxSizing: "border-box",
          background: "var(--hp-bg-gradient, #0f172a)",
          color: "var(--hp-text, #f8fafc)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            border: "1px solid var(--hp-border, rgba(148, 163, 184, 0.35))",
            borderRadius: 18,
            padding: 20,
            background: "var(--hp-surface, #111827)",
            boxShadow: "var(--hp-shadow-md, 0 20px 60px rgba(0,0,0,0.28))",
            display: "grid",
            gap: 14,
          }}
        >
          <h1 style={{ margin: 0, color: "var(--hp-heading, #fff)", fontSize: 22 }}>Не удалось открыть приложение</h1>
          <p style={{ margin: 0, color: "var(--hp-muted, #cbd5e1)", lineHeight: 1.45 }}>
            Обновите страницу. Если экран снова пустой, очистите кэш приложения и откройте Hockey Planner заново.
          </p>
          <button
            type="button"
            onClick={this.reload}
            style={{
              border: 0,
              borderRadius: 14,
              padding: "13px 16px",
              background: "var(--hp-primary, #2563eb)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
          <button
            type="button"
            onClick={() => void this.clearCacheAndReload()}
            style={{
              border: "1px solid var(--hp-border, rgba(148, 163, 184, 0.35))",
              borderRadius: 14,
              padding: "13px 16px",
              background: "var(--hp-surface-soft, rgba(148, 163, 184, 0.12))",
              color: "var(--hp-heading, #fff)",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Очистить кэш и обновить
          </button>
        </div>
      </div>
    );
  }
}
