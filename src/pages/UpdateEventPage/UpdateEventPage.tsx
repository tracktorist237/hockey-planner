import { useNavigate, useParams } from "react-router-dom";
import { LoadingIndicator } from "src/components/LoadingIndicator";
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
  const { formData, updateField, handleTypeChange, handleSubmit, loading, loadingInitial, error, isGame, isMeeting, isPractice, teamId, isExternalEvent } =
    useUpdateEventForm({ eventId: id, onUpdated: () => id && navigate(`/events/${id}`) });

  if (!id) {
    return <div style={{ padding: "24px", textAlign: "center" }}>Некорректный ID события</div>;
  }
  if (loadingInitial) {
    return <LoadingIndicator text="Загрузка данных события..." block />;
  }

  return (
    <div style={{ padding: "0", maxWidth: "100%", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", minHeight: "100vh", background: "var(--hp-bg-gradient)", boxSizing: "border-box" }}>
      <FormHeader onBack={() => navigate(`/events/${id}`)} isVisible={isHeaderVisible} title="Редактирование события" />
      <div style={{ padding: "16px", paddingTop: "92px", paddingBottom: "120px", maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {error && <ErrorMessage error={error} />}
          {isExternalEvent && <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: "var(--hp-info-soft)", color: "var(--hp-info)", fontWeight: 800 }}>Дата, команды и место синхронизируются с официальной лигой. Описание и внутренние настройки можно редактировать.</div>}
          <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", boxShadow: "var(--hp-shadow-sm)", width: "100%", boxSizing: "border-box" }}>
            <EventTypeSelector currentType={formData.type} onChange={handleTypeChange} />
            {isMeeting && <MeetingForm title={formData.title} onChange={(value) => updateField("title", value)} />}
            {isGame && <GameForm title={formData.title} leagueName={formData.leagueName} homeTeamName={formData.homeTeamName} awayTeamName={formData.awayTeamName} uniformColorId={formData.uniformColorId} teamId={teamId} sourceLocked={isExternalEvent} onTitleChange={(value) => updateField("title", value)} onLeagueChange={(value) => updateField("leagueName", value)} onHomeChange={(value) => updateField("homeTeamName", value)} onAwayChange={(value) => updateField("awayTeamName", value)} onUniformColorChange={(value) => updateField("uniformColorId", value)} />}
            {isPractice && <PracticeExercisesSection selectedExerciseIds={formData.selectedExerciseIds} teamId={teamId} onChange={(ids) => updateField("selectedExerciseIds", ids)} />}
            <EventDetailsFields title={formData.title} description={formData.description} startTime={formData.startTime} durationMinutes={formData.durationMinutes} isPractice={isPractice} startTimeLocked={isExternalEvent} onTitleChange={(value) => updateField("title", value)} onDescriptionChange={(value) => updateField("description", value)} onStartTimeChange={(value) => updateField("startTime", value)} onDurationChange={(value) => updateField("durationMinutes", value)} />
            <LocationForm locationName={formData.locationName} locationAddress={formData.locationAddress} iceRinkNumber={formData.iceRinkNumber} useAddressSearch={formData.useAddressSearch} sourceLocked={isExternalEvent} onLocationNameChange={(value) => updateField("locationName", value)} onLocationAddressChange={(value) => updateField("locationAddress", value)} onIceRinkNumberChange={(value) => updateField("iceRinkNumber", value)} onToggleSearch={() => updateField("useAddressSearch", !formData.useAddressSearch)} />
          </div>
        </div>
      </div>
      <EventFormActions onCancel={() => navigate(`/events/${id}`)} onSubmit={() => void handleSubmit()} loading={loading} isVisible={isFooterVisible} submitText="💾 Сохранить изменения" loadingText="Сохранение..." />
    </div>
  );
}

export default UpdateEventPage;

