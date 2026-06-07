import { useEffect, useMemo, useState } from "react";
import { getUniformColors } from "src/api/uniformColors";
import { UniformColorDto } from "src/types/events";

interface UniformColorSectionProps {
  selectedUniformColorId: string;
  teamId: string | null;
  onChange: (id: string) => void;
}

export function UniformColorSection({ selectedUniformColorId, teamId, onChange }: UniformColorSectionProps) {
  const [items, setItems] = useState<UniformColorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      </div>

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
