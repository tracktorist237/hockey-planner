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

export function CreateEventPage({ onBack, onCreated }: CreateEventPageProps) {
  const { formData, updateField, handleTypeChange, handleSubmit, loading, error, isGame, isMeeting, isPractice } =
    useEventForm({ onCreated });
  const { isHeaderVisible, isFooterVisible } = useScrollVisibility();

  return (
    <div style={{ padding: "0", maxWidth: "100%", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", minHeight: "100vh", backgroundColor: "#f5f5f5", boxSizing: "border-box" }}>
      <FormHeader onBack={onBack} isVisible={isHeaderVisible} />

      <div style={{ padding: "16px", paddingTop: "92px", paddingBottom: "120px", maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {error && <ErrorMessage error={error} />}

          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", width: "100%", boxSizing: "border-box" }}>
            <EventTypeSelector currentType={formData.type} onChange={handleTypeChange} />

            {isMeeting && <MeetingForm title={formData.title} onChange={(value) => updateField("title", value)} />}

            {isGame && (
              <GameForm
                leagueName={formData.leagueName}
                homeTeamName={formData.homeTeamName}
                awayTeamName={formData.awayTeamName}
                onLeagueChange={(value) => updateField("leagueName", value)}
                onHomeChange={(value) => updateField("homeTeamName", value)}
                onAwayChange={(value) => updateField("awayTeamName", value)}
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

      <EventFormActions onCancel={onBack} onSubmit={() => void handleSubmit()} loading={loading} isVisible={isFooterVisible} />
    </div>
  );
}

export default CreateEventPage;
