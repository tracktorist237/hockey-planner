import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteTeamNews, getNewsFeed, updateTeamNews } from "src/api/teams";
import { BottomNav } from "src/components/BottomNav";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { NotificationBell } from "src/components/NotificationBell";
import { CurrentPlayerHeader } from "src/CurrentPlayerHeader";
import { useAuth } from "src/hooks/useAuth";
import { TeamNewsDto } from "src/types/teams";

const formatNewsDate = (value: string): string =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export function NewsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [news, setNews] = useState<TeamNewsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingBody, setEditingBody] = useState("");
  const [savingNewsId, setSavingNewsId] = useState<string | null>(null);
  const [deletingNewsId, setDeletingNewsId] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    if (!currentUser?.id) {
      setNews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setNews(await getNewsFeed(currentUser.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить новости.");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const startEdit = (item: TeamNewsDto) => {
    setEditingNewsId(item.id);
    setEditingTitle(item.title);
    setEditingBody(item.body);
    setError(null);
    setMessage(null);
  };

  const cancelEdit = () => {
    setEditingNewsId(null);
    setEditingTitle("");
    setEditingBody("");
  };

  const handleUpdate = async (item: TeamNewsDto) => {
    if (!currentUser?.id) return;

    if (!editingTitle.trim() || !editingBody.trim()) {
      setError("У новости должны быть название и текст.");
      return;
    }

    setSavingNewsId(item.id);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateTeamNews(item.teamId, item.id, { title: editingTitle.trim(), body: editingBody.trim() }, currentUser.id);
      setNews((previous) => previous.map((value) => value.id === item.id ? { ...updated, teamName: item.teamName, canManage: true } : value));
      cancelEdit();
      setMessage("Новость обновлена.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось обновить новость.");
    } finally {
      setSavingNewsId(null);
    }
  };

  const handleDelete = async (item: TeamNewsDto) => {
    if (!currentUser?.id) return;

    if (!window.confirm("Удалить эту новость?")) {
      return;
    }

    setDeletingNewsId(item.id);
    setError(null);
    setMessage(null);
    try {
      await deleteTeamNews(item.teamId, item.id, currentUser.id);
      setNews((previous) => previous.filter((value) => value.id !== item.id));
      setMessage("Новость удалена.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось удалить новость.");
    } finally {
      setDeletingNewsId(null);
    }
  };

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

      <main style={{ padding: "16px", paddingBottom: "120px", display: "grid", gap: "12px" }}>
        {error && (
          <div style={{ background: "var(--hp-danger-soft)", color: "var(--hp-danger)", border: "1px solid var(--hp-danger-border)", borderRadius: 14, padding: "12px 14px", fontWeight: 800 }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: "var(--hp-success-soft)", color: "var(--hp-success)", border: "1px solid var(--hp-success-border)", borderRadius: 14, padding: "12px 14px", fontWeight: 800 }}>
            {message}
          </div>
        )}

        {loading && <LoadingIndicator text="Загружаем новости..." block />}

        {!loading && news.length === 0 && (
          <section
            style={{
              backgroundColor: "var(--hp-surface)",
              border: "1px dashed var(--hp-border)",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "var(--hp-shadow-sm)",
              color: "var(--hp-muted)",
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 900, color: "var(--hp-heading)", marginBottom: 8 }}>Новостей пока нет</div>
            Здесь появятся объявления и важные сообщения из ваших команд.
          </section>
        )}

        {!loading &&
          news.map((item) => (
            <article key={item.id} style={{ background: "var(--hp-surface)", border: "1px solid var(--hp-border)", borderRadius: 16, padding: 14, boxShadow: "var(--hp-shadow-sm)" }}>
              {editingNewsId === item.id ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <input
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    maxLength={120}
                    style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-input-bg)", color: "var(--hp-text)", fontWeight: 800 }}
                  />
                  <textarea
                    value={editingBody}
                    onChange={(event) => setEditingBody(event.target.value)}
                    maxLength={2000}
                    style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", minHeight: 100, resize: "vertical", fontFamily: "inherit", background: "var(--hp-input-bg)", color: "var(--hp-text)" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button type="button" onClick={cancelEdit} style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}>
                      Отмена
                    </button>
                    <button type="button" onClick={() => void handleUpdate(item)} disabled={savingNewsId === item.id} style={{ border: 0, borderRadius: 12, padding: "10px", background: "var(--hp-primary)", color: "white", fontWeight: 900, cursor: savingNewsId === item.id ? "wait" : "pointer", opacity: savingNewsId === item.id ? 0.7 : 1 }}>
                      {savingNewsId === item.id ? "Сохраняем..." : "Сохранить"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/teams/${item.teamId}`)}
                        style={{ border: 0, background: "transparent", padding: 0, color: "var(--hp-primary)", fontSize: 12, fontWeight: 900, cursor: "pointer", marginBottom: 5 }}
                      >
                        {item.teamName || "Команда"}
                      </button>
                      <h2 style={{ margin: "0 0 7px", color: "var(--hp-heading)", fontSize: 18, lineHeight: 1.2 }}>{item.title}</h2>
                      <div style={{ color: "var(--hp-muted)", fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
                        {item.authorName || "Команда"} · {formatNewsDate(item.createdAt)}
                        {item.updatedAt && item.updatedAt !== item.createdAt ? " · изменено" : ""}
                      </div>
                    </div>
                    {item.canManage && (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button type="button" onClick={() => startEdit(item)} style={{ border: "1px solid var(--hp-border)", borderRadius: 10, padding: "7px 9px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}>
                          ✎
                        </button>
                        <button type="button" onClick={() => void handleDelete(item)} disabled={deletingNewsId === item.id} style={{ border: "1px solid var(--hp-danger-border)", borderRadius: 10, padding: "7px 9px", background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 900, cursor: deletingNewsId === item.id ? "wait" : "pointer", opacity: deletingNewsId === item.id ? 0.7 : 1 }}>
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ color: "var(--hp-text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{item.body}</div>
                </>
              )}
            </article>
          ))}
      </main>

      <BottomNav activeTab="news" />
    </div>
  );
}
