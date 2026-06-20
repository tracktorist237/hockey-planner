import { useEffect, useMemo, useState } from "react";
import { getExercises } from "src/api/exercises";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { ExerciseDto } from "src/types/events";
import { AddOptionalSectionButton } from "src/pages/CreateEventPage/components/AddOptionalSectionButton";

interface PracticeExercisesSectionProps {
  selectedExerciseIds: string[];
  teamId: string | null;
  onChange: (ids: string[]) => void;
}

export function PracticeExercisesSection({ selectedExerciseIds, teamId, onChange }: PracticeExercisesSectionProps) {
  const [items, setItems] = useState<ExerciseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(selectedExerciseIds.length > 0);

  useEffect(() => {
    if (selectedExerciseIds.length > 0) {
      setIsSectionVisible(true);
    }
  }, [selectedExerciseIds.length]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!teamId) {
      setItems([]);
      setLoading(false);
      return;
    }

    void getExercises(teamId)
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
  }, [teamId]);

  useEffect(() => {
    if (!teamId && selectedExerciseIds.length > 0) {
      onChange([]);
    }
  }, [onChange, selectedExerciseIds.length, teamId]);

  useEffect(() => {
    if (loading || selectedExerciseIds.length === 0) {
      return;
    }

    const availableIds = new Set(items.map((item) => item.id));
    const nextSelectedIds = selectedExerciseIds.filter((id) => availableIds.has(id));
    if (nextSelectedIds.length !== selectedExerciseIds.length) {
      onChange(nextSelectedIds);
    }
  }, [items, loading, onChange, selectedExerciseIds]);

  const selectedSet = useMemo(() => new Set(selectedExerciseIds), [selectedExerciseIds]);

  const toggleExercise = (exerciseId: string) => {
    if (selectedSet.has(exerciseId)) {
      onChange(selectedExerciseIds.filter((id) => id !== exerciseId));
      return;
    }
    onChange([...selectedExerciseIds, exerciseId]);
  };

  if (!isSectionVisible) {
    return (
      <AddOptionalSectionButton onClick={() => setIsSectionVisible(true)}>
        + Добавить упражнение
      </AddOptionalSectionButton>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--hp-surface-soft)", padding: "20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid var(--hp-primary-soft)", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--hp-heading)" }}>🏋️ Упражнения тренировки</h3>
      </div>

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
          <LoadingIndicator text="Загрузка упражнений..." />
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
