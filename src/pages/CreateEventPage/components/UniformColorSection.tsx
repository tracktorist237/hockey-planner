import { useEffect, useMemo, useState } from "react";
import { createUniformColorWithUpload, getUniformColors } from "src/api/uniformColors";
import { UniformColorDto } from "src/types/events";

interface UniformColorSectionProps {
  selectedUniformColorId: string;
  teamId: string | null;
  onChange: (id: string) => void;
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

export function UniformColorSection({ selectedUniformColorId, teamId, onChange }: UniformColorSectionProps) {
  const [items, setItems] = useState<UniformColorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!teamId) {
      setItems([]);
      setLoading(false);
      return;
    }

    void getUniformColors(teamId)
      .then((data) => {
        if (!active) return;
        setItems(data);
      })
      .catch((requestError) => {
        if (!active) return;
        console.error(requestError);
        setError("Не удалось загрузить справочник цвета формы");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [teamId]);

  useEffect(() => {
    if (!teamId && selectedUniformColorId) {
      onChange("");
    }
  }, [onChange, selectedUniformColorId, teamId]);

  useEffect(() => {
    if (!selectedUniformColorId || loading) {
      return;
    }

    if (!items.some((item) => item.id === selectedUniformColorId)) {
      onChange("");
    }
  }, [items, loading, onChange, selectedUniformColorId]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedUniformColorId) ?? null,
    [items, selectedUniformColorId],
  );

  const handleCreate = async () => {
    if (!name.trim() || !file) {
      setError("Укажите название и выберите изображение");
      return;
    }

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setError("Не удалось определить текущего пользователя");
      return;
    }

    if (!teamId) {
      setError("Выберите команду для цвета формы");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createUniformColorWithUpload(name.trim(), file, currentUserId, teamId);
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ru")));
      setName("");
      setFile(null);
      setShowCreateForm(false);
      onChange(created.id);
    } catch (createError) {
      console.error(createError);
      setError("Не удалось добавить цвет формы. Проверьте права и файл изображения.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--hp-surface-soft)",
        padding: "12px",
        borderRadius: "10px",
        marginBottom: "12px",
        border: "1px solid var(--hp-primary-soft)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--hp-heading)" }}>🎽 Цвет формы</h4>
        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          disabled={!teamId}
          style={{ padding: "6px 10px", border: "1px solid var(--hp-info-border)", borderRadius: "8px", backgroundColor: "var(--hp-primary-soft)", color: "var(--hp-primary-text)", fontSize: "12px", fontWeight: "600", cursor: teamId ? "pointer" : "not-allowed", opacity: teamId ? 1 : 0.65 }}
        >
          {showCreateForm ? "Скрыть форму" : "+ Добавить в справочник"}
        </button>
      </div>

      {showCreateForm && (
        <div style={{ marginBottom: "8px", display: "grid", gap: "8px" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название цвета формы" style={{ width: "100%", padding: "9px 10px", borderRadius: "8px", border: "1px solid var(--hp-border)", fontSize: "13px", boxSizing: "border-box" }} />
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ width: "100%", padding: "9px 10px", borderRadius: "8px", border: "1px solid var(--hp-border)", fontSize: "13px", boxSizing: "border-box", backgroundColor: "var(--hp-surface)" }} />
          <button type="button" onClick={() => void handleCreate()} disabled={saving} style={{ justifySelf: "start", padding: "7px 10px", borderRadius: "8px", border: "none", backgroundColor: "var(--hp-primary)", color: "white", fontSize: "12px", fontWeight: "600", cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Сохраняем..." : "Сохранить цвет формы"}
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: "8px", padding: "8px 10px", backgroundColor: "var(--hp-danger-soft)", color: "var(--hp-danger)", borderRadius: "8px", fontSize: "12px" }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: selectedItem ? "8px" : 0 }}>
        <select
          value={selectedUniformColorId}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading || !teamId}
          style={{
            width: "100%",
            padding: "9px 10px",
            borderRadius: "8px",
            border: "1px solid var(--hp-border)",
            backgroundColor: "var(--hp-surface)",
            fontSize: "13px",
            boxSizing: "border-box",
          }}
        >
          <option value="">Не выбрано</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {selectedItem && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px",
            borderRadius: "8px",
            border: "1px solid var(--hp-border)",
            backgroundColor: "var(--hp-surface)",
          }}
        >
          <img
            src={selectedItem.imageUrl}
            alt={selectedItem.name}
            style={{
              display: "block",
              width: "56px",
              height: "56px",
              objectFit: "cover",
              borderRadius: "6px",
              backgroundColor: "var(--hp-surface)",
              border: "1px solid var(--hp-neutral-soft)",
            }}
          />
          <div style={{ display: "grid", gap: "2px" }}>
            <span style={{ fontSize: "13px", color: "var(--hp-heading)", fontWeight: 600 }}>{selectedItem.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
