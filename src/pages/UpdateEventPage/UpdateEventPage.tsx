import { useNavigate, useParams } from "react-router-dom";
import { useScrollVisibility } from "src/hooks/useScrollVisibility";
import "src/pages/CreateEventPage/CreateEventPage.css";
import { ErrorMessage } from "src/pages/CreateEventPage/components/ErrorMessage";
import { EventDetailsFields } from "src/pages/CreateEventPage/components/EventDetailsFields";
import { EventFormActions } from "src/pages/CreateEventPage/components/EventFormActions";
import { EventTypeSelector } from "src/pages/CreateEventPage/components/EventTypeSelector";
import { FormHeader } from "src/pages/CreateEventPage/components/FormHeader";
import { GameForm } from "src/pages/CreateEventPage/components/GameForm";
import { LocationForm } from "src/pages/CreateEventPage/components/LocationForm";
import { MeetingForm } from "src/pages/CreateEventPage/components/MeetingForm";
import { PracticeExercisesSection } from "src/pages/CreateEventPage/components/PracticeExercisesSection";
import { useUpdateEventForm } from "src/pages/UpdateEventPage/hooks/useUpdateEventForm";

export function UpdateEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isHeaderVisible, isFooterVisible } = useScrollVisibility();
  const { formData, updateField, handleTypeChange, handleSubmit, loading, loadingInitial, error, isGame, isMeeting, isPractice } =
    useUpdateEventForm({ eventId: id, onUpdated: () => id && navigate(`/events/${id}`) });

  if (!id) {
    return <div style={{ padding: "24px", textAlign: "center" }}>Некорректный ID события</div>;
  }
  if (loadingInitial) {
    return <div style={{ padding: "24px", textAlign: "center" }}>Загрузка данных события...</div>;
  }

  return (
    <div style={{ padding: "0", maxWidth: "100%", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", minHeight: "100vh", backgroundColor: "#f5f5f5", boxSizing: "border-box" }}>
      <FormHeader onBack={() => navigate(`/events/${id}`)} isVisible={isHeaderVisible} title="Редактирование события" />
      <div style={{ padding: "16px", paddingTop: "92px", paddingBottom: "120px", maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {error && <ErrorMessage error={error} />}
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", width: "100%", boxSizing: "border-box" }}>
            <EventTypeSelector currentType={formData.type} onChange={handleTypeChange} />
            {isMeeting && <MeetingForm title={formData.title} onChange={(value) => updateField("title", value)} />}
            {isGame && <GameForm leagueName={formData.leagueName} homeTeamName={formData.homeTeamName} awayTeamName={formData.awayTeamName} onLeagueChange={(value) => updateField("leagueName", value)} onHomeChange={(value) => updateField("homeTeamName", value)} onAwayChange={(value) => updateField("awayTeamName", value)} />}
            {isPractice && <PracticeExercisesSection selectedExerciseIds={formData.selectedExerciseIds} onChange={(ids) => updateField("selectedExerciseIds", ids)} />}
            <EventDetailsFields description={formData.description} startTime={formData.startTime} isPractice={isPractice} onDescriptionChange={(value) => updateField("description", value)} onStartTimeChange={(value) => updateField("startTime", value)} />
            <LocationForm locationName={formData.locationName} locationAddress={formData.locationAddress} iceRinkNumber={formData.iceRinkNumber} useAddressSearch={formData.useAddressSearch} onLocationNameChange={(value) => updateField("locationName", value)} onLocationAddressChange={(value) => updateField("locationAddress", value)} onIceRinkNumberChange={(value) => updateField("iceRinkNumber", value)} onToggleSearch={() => updateField("useAddressSearch", !formData.useAddressSearch)} />
          </div>
        </div>
      </div>
      <EventFormActions onCancel={() => navigate(`/events/${id}`)} onSubmit={() => void handleSubmit()} loading={loading} isVisible={isFooterVisible} submitText="💾 Сохранить изменения" loadingText="Сохранение..." />
    </div>
  );
}

export default UpdateEventPage;

