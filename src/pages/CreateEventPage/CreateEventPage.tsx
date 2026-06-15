import "src/pages/CreateEventPage/CreateEventPage.css";
import { EventDetailsFields } from "src/pages/CreateEventPage/components/EventDetailsFields";
import { ErrorMessage } from "src/pages/CreateEventPage/components/ErrorMessage";
import { EventFormActions } from "src/pages/CreateEventPage/components/EventFormActions";
import { EventTypeSelector } from "src/pages/CreateEventPage/components/EventTypeSelector";
import { FormHeader } from "src/pages/CreateEventPage/components/FormHeader";
import { GameForm } from "src/pages/CreateEventPage/components/GameForm";
import { LocationForm } from "src/pages/CreateEventPage/components/LocationForm";
import { MeetingForm } from "src/pages/CreateEventPage/components/MeetingForm";
import { PracticeExercisesSection } from "src/pages/CreateEventPage/components/PracticeExercisesSection";
import { useEventForm } from "src/pages/CreateEventPage/hooks/useEventForm";
import { CreateEventPageProps } from "src/pages/CreateEventPage/types";
import { useScrollVisibility } from "src/hooks/useScrollVisibility";
import { getEvent, getEvents } from "src/api/events";
import { getMyTeams } from "src/api/teams";
import { useAuth } from "src/hooks/useAuth";
import { EventDto, EventLookUpDto } from "src/types/events";
import { TeamDto } from "src/types/teams";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function CreateEventPage({ onBack, onCreated, currentTeamId }: CreateEventPageProps) {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(currentTeamId ?? null);
  const [copyEvents, setCopyEvents] = useState<EventLookUpDto[]>([]);
  const [copyEventId, setCopyEventId] = useState("");
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyAppliedId, setCopyAppliedId] = useState<string | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const { formData, updateField, handleTypeChange, handleSubmit, loading, error, isGame, isMeeting, isPractice, setFormData, setError } =
    useEventForm({ onCreated, teamId: selectedTeamId });
  const { isHeaderVisible, isFooterVisible } = useScrollVisibility();
  const manageableTeams = teams.filter((team) => team.myRole === 1 || team.myRole === 2);
  const teamOptions = manageableTeams;
  const copyFromEventId = searchParams.get("copyFrom");

  const sortedCopyEvents = useMemo(
    () => [...copyEvents].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [copyEvents],
  );

  useEffect(() => {
    setSelectedTeamId(currentTeamId ?? null);
  }, [currentTeamId]);

  useEffect(() => {
    if (!currentUser?.id) {
      setTeams([]);
      return;
    }

    void getMyTeams(currentUser.id)
      .then(setTeams)
      .catch(() => setTeams([]));
  }, [currentUser?.id]);

  useEffect(() => {
    if (teamOptions.length === 0) {
      return;
    }

    if (!selectedTeamId || !teamOptions.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teamOptions[0].id);
    }
  }, [selectedTeamId, teamOptions]);

  useEffect(() => {
    if (!currentUser?.id || !selectedTeamId) {
      setCopyEvents([]);
      return;
    }

    let isMounted = true;
    void getEvents(currentUser.id, selectedTeamId)
      .then((result) => {
        if (isMounted) {
          setCopyEvents(result.events ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCopyEvents([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, selectedTeamId]);

  const applyCopiedEvent = useCallback((source: EventDto) => {
    setFormData({
      title: source.type === 3 ? source.title ?? "" : "",
      description: source.description ?? "",
      startTime: "",
      locationName: source.locationName ?? "",
      locationAddress: source.locationAddress ?? "",
      iceRinkNumber: source.iceRinkNumber ?? "",
      leagueName: source.leagueName ?? "",
      homeTeamName: source.homeTeamName ?? "",
      awayTeamName: source.awayTeamName ?? "",
      uniformColorId: source.uniformColorId ?? "",
      selectedExerciseIds: source.exercises?.map((exercise) => exercise.id) ?? [],
      useAddressSearch: true,
      type: source.type,
    });

    if (source.teamId) {
      setSelectedTeamId(source.teamId);
    }

    setCopyEventId(source.id);
    setCopyAppliedId(source.id);
    setCopyModalOpen(false);
    setError(null);
  }, [setError, setFormData]);

  const handleCopyEvent = useCallback(async (eventId: string) => {
    if (!eventId) {
      return;
    }

    setCopyLoading(true);
    setError(null);
    try {
      const source = await getEvent(eventId);
      applyCopiedEvent(source);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось скопировать данные мероприятия.");
    } finally {
      setCopyLoading(false);
    }
  }, [applyCopiedEvent, setError]);

  useEffect(() => {
    if (!copyFromEventId || copyAppliedId === copyFromEventId) {
      return;
    }

    void handleCopyEvent(copyFromEventId);
  }, [copyAppliedId, copyFromEventId, handleCopyEvent]);

  const submit = async () => {
    if (!selectedTeamId) {
      setError("Выберите команду, где вы владелец или администратор.");
      return;
    }

    await handleSubmit();
  };

  return (
    <div style={{ padding: "0", maxWidth: "100%", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", minHeight: "100vh", background: "var(--hp-bg-gradient)", boxSizing: "border-box" }}>
      <FormHeader onBack={onBack} isVisible={isHeaderVisible} onCopyFromEvent={() => setCopyModalOpen(true)} />

      {copyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 240,
            backgroundColor: "rgba(15, 23, 42, 0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            boxSizing: "border-box",
          }}
          onClick={() => setCopyModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              borderRadius: 18,
              background: "var(--hp-surface)",
              border: "1px solid var(--hp-border)",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
              padding: 16,
              display: "grid",
              gap: 12,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: "var(--hp-heading)" }}>Скопировать из мероприятия</h2>
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                aria-label="Закрыть"
                style={{ border: 0, background: "transparent", color: "var(--hp-muted)", fontSize: 24, cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ color: "var(--hp-muted)", fontSize: 13, lineHeight: 1.4 }}>
              Скопируются тип, команды, описание, место, форма и упражнения. Дата и время останутся пустыми.
            </div>

            <select
              value={copyEventId}
              onChange={(event) => setCopyEventId(event.target.value)}
              disabled={copyLoading || sortedCopyEvents.length === 0}
              style={{
                width: "100%",
                minWidth: 0,
                padding: "12px 14px",
                border: "1px solid var(--hp-border)",
                borderRadius: "10px",
                fontSize: "15px",
                backgroundColor: "var(--hp-input-bg)",
                color: "var(--hp-text)",
                boxSizing: "border-box",
              }}
            >
              <option value="">Выберите мероприятие</option>
              {sortedCopyEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {new Date(event.startTime).toLocaleDateString("ru-RU")} · {event.title || "Без названия"}
                </option>
              ))}
            </select>

            {sortedCopyEvents.length === 0 && (
              <div style={{ color: "var(--hp-muted)", fontSize: 13 }}>
                В выбранной команде пока нет мероприятий для копирования.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                type="button"
                onClick={() => setCopyModalOpen(false)}
                style={{ border: "1px solid var(--hp-border)", borderRadius: 12, padding: "11px 12px", background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontWeight: 900, cursor: "pointer" }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void handleCopyEvent(copyEventId)}
                disabled={copyLoading || !copyEventId}
                style={{
                  border: 0,
                  borderRadius: 12,
                  padding: "11px 12px",
                  background: "var(--hp-primary)",
                  color: "white",
                  fontWeight: 900,
                  cursor: copyLoading ? "wait" : copyEventId ? "pointer" : "not-allowed",
                  opacity: copyLoading || !copyEventId ? 0.7 : 1,
                }}
              >
                {copyLoading ? "Копируем..." : "Копировать"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px", paddingTop: "92px", paddingBottom: "120px", maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {error && <ErrorMessage error={error} />}

          <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", boxShadow: "var(--hp-shadow-sm)", width: "100%", boxSizing: "border-box" }}>
            {teamOptions.length > 0 && (
              <label style={{ display: "block", marginBottom: "16px" }}>
                <div style={{ fontSize: "14px", color: "var(--hp-muted)", marginBottom: "8px", fontWeight: 700 }}>Команда</div>
                <select
                  value={selectedTeamId ?? ""}
                  onChange={(event) => setSelectedTeamId(event.target.value || null)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid var(--hp-border)",
                    borderRadius: "10px",
                    fontSize: "16px",
                    backgroundColor: "var(--hp-surface)",
                    boxSizing: "border-box",
                  }}
                >
                  {teamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <EventTypeSelector currentType={formData.type} onChange={handleTypeChange} />

            {isMeeting && <MeetingForm title={formData.title} onChange={(value) => updateField("title", value)} />}

            {isGame && (
              <GameForm
                leagueName={formData.leagueName}
                homeTeamName={formData.homeTeamName}
                awayTeamName={formData.awayTeamName}
                uniformColorId={formData.uniformColorId}
                teamId={selectedTeamId}
                onLeagueChange={(value) => updateField("leagueName", value)}
                onHomeChange={(value) => updateField("homeTeamName", value)}
                onAwayChange={(value) => updateField("awayTeamName", value)}
                onUniformColorChange={(value) => updateField("uniformColorId", value)}
              />
            )}

            {isPractice && (
              <PracticeExercisesSection
                selectedExerciseIds={formData.selectedExerciseIds}
                teamId={selectedTeamId}
                onChange={(ids) => updateField("selectedExerciseIds", ids)}
              />
            )}

            <EventDetailsFields
              description={formData.description}
              startTime={formData.startTime}
              isPractice={isPractice}
              onDescriptionChange={(value) => updateField("description", value)}
              onStartTimeChange={(value) => updateField("startTime", value)}
            />

            <LocationForm
              locationName={formData.locationName}
              locationAddress={formData.locationAddress}
              iceRinkNumber={formData.iceRinkNumber}
              useAddressSearch={formData.useAddressSearch}
              onLocationNameChange={(value) => updateField("locationName", value)}
              onLocationAddressChange={(value) => updateField("locationAddress", value)}
              onIceRinkNumberChange={(value) => updateField("iceRinkNumber", value)}
              onToggleSearch={() => updateField("useAddressSearch", !formData.useAddressSearch)}
            />
          </div>
        </div>
      </div>

      <EventFormActions onCancel={onBack} onSubmit={() => void submit()} loading={loading} isVisible={isFooterVisible} />
    </div>
  );
}

export default CreateEventPage;
