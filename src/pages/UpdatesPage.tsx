import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublishedReleases, PublicReleaseNotice } from "src/api/releases";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { NotificationBell } from "src/components/NotificationBell";
import { useAuth } from "src/hooks/useAuth";

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
};

export function UpdatesPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [releases, setReleases] = useState<PublicReleaseNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    void getPublishedReleases()
      .then((items) => {
        if (alive) setReleases(items);
      })
      .catch((loadError) => {
        if (alive) setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить обновления.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--hp-bg-gradient)", color: "var(--hp-text)" }}>
      <div style={{ width: "100%", maxWidth: 600, minHeight: "100vh", margin: "0 auto" }}>
        <div style={{ background: "var(--hp-surface)", borderBottom: "1px solid var(--hp-border)", boxShadow: "var(--hp-shadow-sm)", padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <button
                type="button"
                onClick={() => navigate("/settings")}
                aria-label="Назад"
                style={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--hp-border)",
                  borderRadius: 10,
                  background: "var(--hp-surface)",
                  color: "var(--hp-heading)",
                  fontSize: 20,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ←
              </button>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 20, color: "var(--hp-heading)" }}>Что нового</h1>
                <div style={{ marginTop: 4, color: "var(--hp-muted)", fontSize: 13, lineHeight: 1.3 }}>
                  История обновлений и ближайшие планы
                </div>
              </div>
            </div>
            <NotificationBell currentUserId={currentUser?.id} />
          </div>
        </div>

        <main style={{ padding: 16, display: "grid", gap: 12 }}>
          {loading && <LoadingIndicator text="Загрузка обновлений..." block />}
          {error && (
            <div style={{ border: "1px solid var(--hp-danger-border)", borderRadius: 14, background: "var(--hp-danger-soft)", color: "var(--hp-danger)", padding: 14, fontWeight: 800 }}>
              {error}
            </div>
          )}

          {!loading && !error && releases.length === 0 && (
            <div style={{ border: "1px dashed var(--hp-border)", borderRadius: 16, background: "var(--hp-surface-soft)", color: "var(--hp-muted)", padding: 18, lineHeight: 1.45 }}>
              Опубликованных release notes пока нет. Когда появятся новые записи, они будут здесь.
            </div>
          )}

          {releases.map((release) => (
            <article key={release.id} style={{ background: "var(--hp-surface)", border: "1px solid var(--hp-border)", borderRadius: 16, boxShadow: "var(--hp-shadow-sm)", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--hp-primary)", fontSize: 13, fontWeight: 900 }}>v{release.version}</div>
                  <h2 style={{ margin: "4px 0 0", color: "var(--hp-heading)", fontSize: 18, overflowWrap: "anywhere" }}>{release.title}</h2>
                </div>
                {release.publishedAt && (
                  <span style={{ borderRadius: 999, padding: "5px 9px", background: "var(--hp-neutral-soft)", color: "var(--hp-neutral)", fontSize: 12, fontWeight: 900 }}>
                    {formatDate(release.publishedAt)}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 12, color: "var(--hp-text)", lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{release.body}</div>
            </article>
          ))}
        </main>
      </div>
    </div>
  );
}
