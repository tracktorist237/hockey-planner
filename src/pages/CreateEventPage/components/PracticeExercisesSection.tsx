import { useEffect, useMemo, useState } from "react";
import { createExercise, getExercises } from "src/api/exercises";
import { ExerciseDto } from "src/types/events";

interface PracticeExercisesSectionProps {
  selectedExerciseIds: string[];
  onChange: (ids: string[]) => void;
}

const getCurrentUserId = (): string | null => {
  const raw = localStorage.getItem("currentUser");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { id?: string | null };
    return parsed.id ?? null;
  } catch {
    return null;
  }
};

export function PracticeExercisesSection({ selectedExerciseIds, onChange }: PracticeExercisesSectionProps) {
  const [items, setItems] = useState<ExerciseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [name, setName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void getExercises()
      .then((data) => {
        if (!active) return;
        setItems(data);
      })
      .catch((requestError) => {
        if (!active) return;
        console.error(requestError);
        setError("Не удалось загрузить банк упражнений");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedSet = useMemo(() => new Set(selectedExerciseIds), [selectedExerciseIds]);

  const toggleExercise = (exerciseId: string) => {
    if (selectedSet.has(exerciseId)) {
      onChange(selectedExerciseIds.filter((id) => id !== exerciseId));
      return;
    }
    onChange([...selectedExerciseIds, exerciseId]);
  };

  const handleCreate = async () => {
    if (!name.trim() || !videoUrl.trim()) {
      setError("Укажите название и ссылку на видео");
      return;
    }

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setError("Не удалось определить текущего пользователя");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createExercise(
        {
          name: name.trim(),
          videoUrl: videoUrl.trim(),
        },
        currentUserId,
      );
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ru")));
      setName("");
      setVideoUrl("");
      setShowCreateForm(false);
      onChange([...selectedExerciseIds, created.id]);
    } catch (createError) {
      console.error(createError);
      setError("Не удалось добавить упражнение. Проверьте права доступа.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--hp-surface-soft)", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid var(--hp-primary-soft)", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--hp-heading)" }}>🏋️ Упражнения тренировки</h3>
        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          style={{ padding: "8px 12px", border: "1px solid var(--hp-info-border)", borderRadius: "10px", backgroundColor: "var(--hp-primary-soft)", color: "var(--hp-primary-text)", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
        >
          {showCreateForm ? "Скрыть форму" : "+ Добавить в банк"}
        </button>
      </div>

      {showCreateForm && (
        <div style={{ marginBottom: "12px", display: "grid", gap: "8px" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название упражнения" style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--hp-border)", fontSize: "14px", boxSizing: "border-box" }} />
          <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Ссылка на видео" style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--hp-border)", fontSize: "14px", boxSizing: "border-box" }} />
          <button type="button" onClick={() => void handleCreate()} disabled={saving} style={{ justifySelf: "start", padding: "8px 12px", borderRadius: "10px", border: "none", backgroundColor: "var(--hp-primary)", color: "white", fontSize: "13px", fontWeight: "600", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Сохраняем..." : "Сохранить упражнение"}
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: "10px", padding: "10px 12px", backgroundColor: "var(--hp-danger-soft)", color: "var(--hp-danger)", borderRadius: "10px", fontSize: "13px" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isListExpanded ? "10px" : 0 }}>
        <span style={{ fontSize: "13px", color: "var(--hp-muted)" }}>
          Выбрано упражнений: <strong>{selectedExerciseIds.length}</strong>
        </span>
        <button
          type="button"
          onClick={() => setIsListExpanded((prev) => !prev)}
          style={{ padding: "6px 10px", border: "1px solid var(--hp-border)", borderRadius: "10px", backgroundColor: "var(--hp-surface)", color: "var(--hp-heading)", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
        >
          {isListExpanded ? "Свернуть список ▲" : "Показать список ▼"}
        </button>
      </div>

      {isListExpanded && (
        loading ? (
          <div style={{ fontSize: "14px", color: "var(--hp-muted)" }}>Загрузка упражнений...</div>
        ) : items.length === 0 ? (
          <div style={{ fontSize: "14px", color: "var(--hp-muted)" }}>Банк упражнений пока пуст</div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {items.map((item) => {
              const selected = selectedSet.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleExercise(item.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${selected ? "var(--hp-primary)" : "var(--hp-border)"}`,
                    backgroundColor: selected ? "var(--hp-primary-soft)" : "var(--hp-surface)",
                    color: "var(--hp-heading)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "grid", gap: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>{item.name}</span>
                    <span style={{ fontSize: "12px", color: "var(--hp-muted)", wordBreak: "break-all" }}>{item.videoUrl}</span>
                  </div>
                  <span style={{ fontSize: "18px" }}>{selected ? "✅" : "➕"}</span>
                </button>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
