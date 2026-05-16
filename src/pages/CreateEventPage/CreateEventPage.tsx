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
import { getMyTeams } from "src/api/teams";
import { useAuth } from "src/hooks/useAuth";
import { TeamDto } from "src/types/teams";
import { useEffect, useState } from "react";

export function CreateEventPage({ onBack, onCreated, currentTeamId }: CreateEventPageProps) {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(currentTeamId ?? null);
  const { formData, updateField, handleTypeChange, handleSubmit, loading, error, isGame, isMeeting, isPractice, setError } =
    useEventForm({ onCreated, teamId: selectedTeamId });
  const { isHeaderVisible, isFooterVisible } = useScrollVisibility();
  const manageableTeams = teams.filter((team) => team.myRole === 1 || team.myRole === 2);
  const teamOptions = manageableTeams;

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

  const submit = async () => {
    if (!selectedTeamId) {
      setError("Выберите команду, где вы владелец или администратор.");
      return;
    }

    await handleSubmit();
  };

  return (
    <div style={{ padding: "0", maxWidth: "100%", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", minHeight: "100vh", backgroundColor: "#f5f5f5", boxSizing: "border-box" }}>
      <FormHeader onBack={onBack} isVisible={isHeaderVisible} />

      <div style={{ padding: "16px", paddingTop: "92px", paddingBottom: "120px", maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {error && <ErrorMessage error={error} />}

          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", width: "100%", boxSizing: "border-box" }}>
            {teamOptions.length > 0 && (
              <label style={{ display: "block", marginBottom: "16px" }}>
                <div style={{ fontSize: "14px", color: "#555", marginBottom: "8px", fontWeight: 700 }}>Команда</div>
                <select
                  value={selectedTeamId ?? ""}
                  onChange={(event) => setSelectedTeamId(event.target.value || null)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    fontSize: "16px",
                    backgroundColor: "white",
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
                onLeagueChange={(value) => updateField("leagueName", value)}
                onHomeChange={(value) => updateField("homeTeamName", value)}
                onAwayChange={(value) => updateField("awayTeamName", value)}
                onUniformColorChange={(value) => updateField("uniformColorId", value)}
              />
            )}

            {isPractice && (
              <PracticeExercisesSection
                selectedExerciseIds={formData.selectedExerciseIds}
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
