import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "src/pages/CreatePlayerFormPage/components/ErrorMessage";
import { FormHeader } from "src/pages/CreatePlayerFormPage/components/FormHeader";
import { HockeyInfoForm } from "src/pages/CreatePlayerFormPage/components/HockeyInfoForm";
import { PersonalInfoForm } from "src/pages/CreatePlayerFormPage/components/PersonalInfoForm";
import { PlayerFormActions } from "src/pages/CreatePlayerFormPage/components/PlayerFormActions";
import { usePlayerForm } from "src/pages/CreatePlayerFormPage/hooks/usePlayerForm";

export function CreatePlayerFormPage() {
  const navigate = useNavigate();
  const { formData, errors, submitting, error, handleChange, handleSubmit, calculateAge, getFieldStatus } =
    usePlayerForm({ onSuccess: () => navigate("/events") });

  return (
    <div style={{ padding: "16px", minHeight: "100vh", backgroundColor: "#f5f5f5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", boxSizing: "border-box" }}>
      <FormHeader onBack={() => navigate("/")} />
      {error && <ErrorMessage error={error} />}

      <form onSubmit={(event) => void handleSubmit(event)}>
        <PersonalInfoForm formData={formData} errors={errors} getFieldStatus={getFieldStatus} onChange={handleChange} calculateAge={calculateAge} />
        <HockeyInfoForm formData={formData} errors={errors} getFieldStatus={getFieldStatus} onChange={handleChange} />
        <PlayerFormActions submitting={submitting} onCancel={() => navigate("/")} />
      </form>

      <style>
        {`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          input:focus, select:focus { outline: none; border-color: #1976d2 !important; box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1); }
          input[type="date"] { appearance: none; -webkit-appearance: none; padding: 14px; font-family: inherit; }
          input[type="date"]::-webkit-calendar-picker-indicator { padding: 8px; margin-right: -8px; cursor: pointer; }
          @media (max-width: 360px) { div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 12px !important; } div[style*="padding: 20px"] { padding: 16px !important; } button[style*="padding: 16px 24px"] { padding: 14px 20px !important; } }
          @media (min-width: 768px) { div[style*="minHeight: 100vh"] { max-width: 600px; margin: 0 auto; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; min-height: 100vh; } }
        `}
      </style>
    </div>
  );
}

export default CreatePlayerFormPage;
