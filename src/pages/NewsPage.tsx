import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteTeamNews, getNewsFeed, updateTeamNews, uploadTeamNewsImage } from "src/api/teams";
import { BottomNav } from "src/components/BottomNav";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { TeamTablesPanel } from "src/components/TeamTablesPanel";
import { MainPageHeader } from "src/components/MainPageHeader";
import { useAuth } from "src/hooks/useAuth";
import { TeamNewsDto } from "src/types/teams";
import { useSwipeTabs } from "src/hooks/useSwipeTabs";

type NewsTab = "news" | "tables";
const newsTabs: readonly NewsTab[] = ["news", "tables"];

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
  const [activeTab, setActiveTab] = useState<NewsTab>("news");
  const [news, setNews] = useState<TeamNewsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingBody, setEditingBody] = useState("");
  const [editingImageUrl, setEditingImageUrl] = useState("");
  const [imageUploadingNewsId, setImageUploadingNewsId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [savingNewsId, setSavingNewsId] = useState<string | null>(null);
  const [deletingNewsId, setDeletingNewsId] = useState<string | null>(null);
  const newsSwipeHandlers = useSwipeTabs({ tabs: newsTabs, activeTab, onChange: setActiveTab });

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
    setEditingImageUrl(item.imageUrl ?? "");
    setError(null);
    setMessage(null);
  };

  const cancelEdit = () => {
    setEditingNewsId(null);
    setEditingTitle("");
    setEditingBody("");
    setEditingImageUrl("");
  };

  const handleUploadEditImage = async (item: TeamNewsDto, file: File | null) => {
    if (!currentUser?.id || !file) return;

    if (!file.type.startsWith("image/")) {
      setError("Нужен файл изображения.");
      return;
    }

    setImageUploadingNewsId(item.id);
    setError(null);
    setMessage(null);
    try {
      setEditingImageUrl(await uploadTeamNewsImage(item.teamId, file, currentUser.id));
      setMessage("Изображение новости загружено.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить изображение новости.");
    } finally {
      setImageUploadingNewsId(null);
    }
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
      const updated = await updateTeamNews(item.teamId, item.id, { title: editingTitle.trim(), body: editingBody.trim(), imageUrl: editingImageUrl.trim() || null }, currentUser.id);
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
      {...newsSwipeHandlers}
      style={{
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        color: "var(--hp-text)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <MainPageHeader title="Новости" />

      <main style={{ padding: "16px", paddingBottom: "120px", display: "grid", gap: "12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 5, borderRadius: 16, background: "var(--hp-surface-muted)" }}>
          {([
            ["news", "Новости"],
            ["tables", "Таблицы"],
          ] as Array<[typeof activeTab, string]>).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                border: 0,
                borderRadius: 12,
                padding: "10px 4px",
                background: activeTab === tab ? "var(--hp-surface)" : "transparent",
                color: activeTab === tab ? "var(--hp-text-strong)" : "var(--hp-muted)",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: activeTab === tab ? "var(--hp-shadow-sm)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "tables" && (
          <TeamTablesPanel currentUserId={currentUser?.id} onOpenTeam={(teamId) => navigate(`/teams/${teamId}`)} />
        )}

        {activeTab === "news" && (
          <>
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
                  {editingImageUrl && (
                    <button type="button" onClick={() => setPreviewImageUrl(editingImageUrl)} style={{ border: 0, padding: 0, background: "transparent", cursor: "zoom-in", textAlign: "left" }}>
                      <img src={editingImageUrl} alt="" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--hp-border)", maxHeight: 320, objectFit: "cover", background: "var(--hp-surface-soft)", display: "block" }} />
                    </button>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: editingImageUrl ? "1fr auto" : "1fr", gap: 8 }}>
                    <label style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: imageUploadingNewsId === item.id ? "wait" : "pointer", textAlign: "center", opacity: imageUploadingNewsId === item.id ? 0.7 : 1 }}>
                      {imageUploadingNewsId === item.id ? "Загружаем..." : editingImageUrl ? "Заменить картинку" : "Прикрепить картинку"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={imageUploadingNewsId !== null}
                        onChange={(event) => {
                          void handleUploadEditImage(item, event.target.files?.[0] ?? null);
                          event.currentTarget.value = "";
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                    {editingImageUrl && (
                      <button type="button" onClick={() => setEditingImageUrl("")} style={{ border: "1px solid var(--hp-danger-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-danger-soft)", color: "var(--hp-danger)", fontWeight: 900, cursor: "pointer" }}>
                        Убрать
                      </button>
                    )}
                  </div>
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
                  {item.imageUrl && (
                    <button type="button" onClick={() => setPreviewImageUrl(item.imageUrl ?? null)} style={{ border: 0, padding: 0, margin: "0 0 10px", background: "transparent", cursor: "zoom-in", width: "100%", textAlign: "left" }}>
                      <img src={item.imageUrl} alt="" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--hp-border)", maxHeight: 320, objectFit: "cover", background: "var(--hp-surface-soft)", display: "block" }} />
                    </button>
                  )}
                  <div style={{ color: "var(--hp-text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{item.body}</div>
                </>
              )}
            </article>
          ))}
          </>
        )}
      </main>

      {previewImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImageUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.86)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setPreviewImageUrl(null)}
            style={{
              position: "fixed",
              top: 14,
              right: 14,
              width: 42,
              height: 42,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(15, 23, 42, 0.68)",
              color: "white",
              fontSize: 24,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
          <img
            src={previewImageUrl}
            alt=""
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "92vh", objectFit: "contain", borderRadius: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}
          />
        </div>
      )}

      <BottomNav activeTab="news" />
    </div>
  );
}
