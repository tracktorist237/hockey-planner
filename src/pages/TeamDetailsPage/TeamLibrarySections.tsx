import { useEffect, useState } from "react";
import { createExercise, deleteExercise, getExercises, updateExercise } from "src/api/exercises";
import { createUniformColorWithUpload, deleteUniformColor, getUniformColors, updateUniformColor } from "src/api/uniformColors";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { ExerciseDto, UniformColorDto } from "src/types/events";
import { cardStyle, inputStyle } from "src/pages/TeamsPage/components/styles";

interface TeamLibrarySectionProps {
  teamId: string;
  currentUserId: string;
  onError: (message: string) => void;
  onMessage: (message: string) => void;
}

const secondaryButtonStyle = {
  border: "1px solid var(--hp-border)",
  borderRadius: 12,
  padding: "9px 11px",
  background: "var(--hp-surface)",
  color: "var(--hp-heading)",
  fontWeight: 900,
  cursor: "pointer",
} as const;

const dangerButtonStyle = {
  border: "1px solid var(--hp-danger-border)",
  borderRadius: 12,
  padding: "9px 11px",
  background: "var(--hp-danger-soft)",
  color: "var(--hp-danger)",
  fontWeight: 900,
  cursor: "pointer",
} as const;

const primaryButtonStyle = {
  border: 0,
  borderRadius: 14,
  padding: "13px 14px",
  background: "var(--hp-primary)",
  color: "white",
  fontWeight: 900,
} as const;

export function ExerciseBankManager({ teamId, currentUserId, onError, onMessage }: TeamLibrarySectionProps) {
  const [items, setItems] = useState<ExerciseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [editName, setEditName] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);

    void getExercises(teamId)
      .then((data) => {
        if (!active) return;
        setItems(data);
      })
      .catch((requestError) => {
        if (!active) return;
        console.error(requestError);
        onError("Не удалось загрузить банк упражнений.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [onError, teamId]);

  const sortExercises = (values: ExerciseDto[]) =>
    [...values].sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const resetEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditVideoUrl("");
  };

  const handleCreate = async () => {
    if (!name.trim() || !videoUrl.trim()) {
      onError("Укажите название упражнения и ссылку на видео.");
      return;
    }

    setSaving(true);
    try {
      const created = await createExercise({ name: name.trim(), videoUrl: videoUrl.trim(), teamId }, currentUserId);
      setItems((previous) => sortExercises([...previous, created]));
      setName("");
      setVideoUrl("");
      onMessage("Упражнение добавлено в банк.");
    } catch (requestError) {
      console.error(requestError);
      onError("Не удалось добавить упражнение. Проверьте права доступа.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: ExerciseDto) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditVideoUrl(item.videoUrl);
  };

  const handleUpdate = async (item: ExerciseDto) => {
    if (!editName.trim() || !editVideoUrl.trim()) {
      onError("Укажите название упражнения и ссылку на видео.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateExercise(item.id, { name: editName.trim(), videoUrl: editVideoUrl.trim() }, currentUserId);
      setItems((previous) => sortExercises(previous.map((value) => (value.id === updated.id ? updated : value))));
      resetEdit();
      onMessage("Упражнение обновлено.");
    } catch (requestError) {
      console.error(requestError);
      onError("Не удалось обновить упражнение.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ExerciseDto) => {
    if (!window.confirm(`Удалить упражнение «${item.name}»? Оно пропадёт из тренировок, где было выбрано.`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      await deleteExercise(item.id, currentUserId);
      setItems((previous) => previous.filter((value) => value.id !== item.id));
      if (editingId === item.id) resetEdit();
      onMessage("Упражнение удалено.");
    } catch (requestError) {
      console.error(requestError);
      onError("Не удалось удалить упражнение.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section style={{ ...cardStyle, marginTop: 14 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, color: "var(--hp-text-strong)" }}>Банк упражнений</h2>
      <div style={{ marginBottom: 12, color: "var(--hp-muted)", fontSize: 14, lineHeight: 1.4 }}>Добавляйте упражнения, которые потом можно выбрать при создании тренировки.</div>

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Название упражнения" style={inputStyle} />
        <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="Ссылка на видео" style={inputStyle} />
        <button type="button" onClick={() => void handleCreate()} disabled={saving} style={{ ...primaryButtonStyle, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.72 : 1 }}>
          {saving ? "Сохраняем..." : "+ Добавить в банк"}
        </button>
      </div>

      {loading ? (
        <LoadingIndicator text="Загружаем упражнения..." />
      ) : items.length === 0 ? (
        <div style={{ color: "var(--hp-muted)", fontSize: 14 }}>Банк упражнений пока пуст.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item) => {
            const isEditing = editingId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <div key={item.id} style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "10px 12px", background: "var(--hp-surface-soft)" }}>
                {isEditing ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Название упражнения" style={inputStyle} />
                    <input value={editVideoUrl} onChange={(event) => setEditVideoUrl(event.target.value)} placeholder="Ссылка на видео" style={inputStyle} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button type="button" onClick={() => void handleUpdate(item)} disabled={saving} style={{ ...primaryButtonStyle, padding: "10px 12px", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.72 : 1 }}>
                        Сохранить
                      </button>
                      <button type="button" onClick={resetEdit} disabled={saving} style={secondaryButtonStyle}>
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ color: "var(--hp-heading)", fontWeight: 900 }}>{item.name}</div>
                    <div style={{ marginTop: 4, color: "var(--hp-muted)", fontSize: 13, wordBreak: "break-all" }}>{item.videoUrl}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <button type="button" onClick={() => startEdit(item)} style={secondaryButtonStyle}>
                        Изменить
                      </button>
                      <button type="button" onClick={() => void handleDelete(item)} disabled={isDeleting} style={{ ...dangerButtonStyle, cursor: isDeleting ? "wait" : "pointer", opacity: isDeleting ? 0.72 : 1 }}>
                        {isDeleting ? "Удаляем..." : "Удалить"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function UniformColorsManager({ teamId, currentUserId, onError, onMessage }: TeamLibrarySectionProps) {
  const [items, setItems] = useState<UniformColorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);

    void getUniformColors(teamId)
      .then((data) => {
        if (!active) return;
        setItems(data);
      })
      .catch((requestError) => {
        if (!active) return;
        console.error(requestError);
        onError("Не удалось загрузить справочник цвета формы.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [onError, teamId]);

  const sortColors = (values: UniformColorDto[]) =>
    [...values].sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const resetEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditImageUrl("");
  };

  const handleCreate = async () => {
    if (!name.trim() || !file) {
      onError("Укажите название цвета формы и выберите изображение.");
      return;
    }

    setSaving(true);
    try {
      const created = await createUniformColorWithUpload(name.trim(), file, currentUserId, teamId);
      setItems((previous) => sortColors([...previous, created]));
      setName("");
      setFile(null);
      onMessage("Цвет формы добавлен в справочник.");
    } catch (requestError) {
      console.error(requestError);
      onError("Не удалось добавить цвет формы. Проверьте права и файл изображения.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: UniformColorDto) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditImageUrl(item.imageUrl);
  };

  const handleUpdate = async (item: UniformColorDto) => {
    if (!editName.trim() || !editImageUrl.trim()) {
      onError("Укажите название цвета формы и ссылку на изображение.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateUniformColor(item.id, { name: editName.trim(), imageUrl: editImageUrl.trim() }, currentUserId);
      setItems((previous) => sortColors(previous.map((value) => (value.id === updated.id ? updated : value))));
      resetEdit();
      onMessage("Цвет формы обновлён.");
    } catch (requestError) {
      console.error(requestError);
      onError("Не удалось обновить цвет формы.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: UniformColorDto) => {
    if (!window.confirm(`Удалить цвет формы «${item.name}»? Он будет снят с матчей и звеньев, где был выбран.`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      await deleteUniformColor(item.id, currentUserId);
      setItems((previous) => previous.filter((value) => value.id !== item.id));
      if (editingId === item.id) resetEdit();
      onMessage("Цвет формы удалён.");
    } catch (requestError) {
      console.error(requestError);
      onError("Не удалось удалить цвет формы.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section style={{ ...cardStyle, marginTop: 14 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, color: "var(--hp-text-strong)" }}>Справочник формы</h2>
      <div style={{ marginBottom: 12, color: "var(--hp-muted)", fontSize: 14, lineHeight: 1.4 }}>Добавляйте варианты формы, которые потом можно выбрать для матча.</div>

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Название цвета формы" style={inputStyle} />
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => setFile(event.target.files?.[0] ?? null)} style={inputStyle} />
        <button type="button" onClick={() => void handleCreate()} disabled={saving} style={{ ...primaryButtonStyle, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.72 : 1 }}>
          {saving ? "Сохраняем..." : "+ Добавить в справочник"}
        </button>
      </div>

      {loading ? (
        <LoadingIndicator text="Загружаем цвета формы..." />
      ) : items.length === 0 ? (
        <div style={{ color: "var(--hp-muted)", fontSize: 14 }}>Справочник формы пока пуст.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item) => {
            const isEditing = editingId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <div key={item.id} style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: 10, background: "var(--hp-surface-soft)" }}>
                {isEditing ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Название цвета формы" style={inputStyle} />
                    <input value={editImageUrl} onChange={(event) => setEditImageUrl(event.target.value)} placeholder="Ссылка на изображение" style={inputStyle} />
                    {editImageUrl && (
                      <img src={editImageUrl} alt={editName || item.name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--hp-neutral-soft)", background: "var(--hp-surface)" }} />
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button type="button" onClick={() => void handleUpdate(item)} disabled={saving} style={{ ...primaryButtonStyle, padding: "10px 12px", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.72 : 1 }}>
                        Сохранить
                      </button>
                      <button type="button" onClick={resetEdit} disabled={saving} style={secondaryButtonStyle}>
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={item.imageUrl} alt={item.name} style={{ width: 58, height: 58, objectFit: "cover", borderRadius: 8, border: "1px solid var(--hp-neutral-soft)", background: "var(--hp-surface)", flexShrink: 0 }} />
                      <div style={{ color: "var(--hp-heading)", fontWeight: 900 }}>{item.name}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <button type="button" onClick={() => startEdit(item)} style={secondaryButtonStyle}>
                        Изменить
                      </button>
                      <button type="button" onClick={() => void handleDelete(item)} disabled={isDeleting} style={{ ...dangerButtonStyle, cursor: isDeleting ? "wait" : "pointer", opacity: isDeleting ? 0.72 : 1 }}>
                        {isDeleting ? "Удаляем..." : "Удалить"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
