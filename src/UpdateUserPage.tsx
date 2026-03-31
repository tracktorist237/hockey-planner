import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById, updateUser } from "src/api/users";
import { ErrorMessage } from "src/pages/CreatePlayerFormPage/components/ErrorMessage";
import { FormHeader } from "src/pages/CreatePlayerFormPage/components/FormHeader";
import { HockeyInfoForm } from "src/pages/CreatePlayerFormPage/components/HockeyInfoForm";
import { PersonalInfoForm } from "src/pages/CreatePlayerFormPage/components/PersonalInfoForm";
import { PlayerFormActions } from "src/pages/CreatePlayerFormPage/components/PlayerFormActions";
import {
  UserFormData,
  ValidationErrors,
  ValidatedFieldName,
} from "src/pages/CreatePlayerFormPage/types";
import { getFieldStatus, validateField } from "src/pages/CreatePlayerFormPage/validation";

const INITIAL_FORM_DATA: UserFormData = {
  firstName: "",
  lastName: "",
  jerseyNumber: null,
  primaryPosition: 3,
  handedness: 2,
  height: null,
  weight: null,
  birthDate: null,
};

const normalizeDateForInput = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

export function UpdateUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Некорректный ID пользователя");
      setLoadingInitial(false);
      return;
    }

    setLoadingInitial(true);
    setError(null);

    getUserById(id)
      .then((user) => {
        setFormData({
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          jerseyNumber: user.jerseyNumber ?? null,
          primaryPosition: user.primaryPosition ?? 3,
          handedness: user.handedness ?? 2,
          height: user.height ?? null,
          weight: user.weight ?? null,
          birthDate: normalizeDateForInput(user.birthDate),
        });
      })
      .catch((requestError) => {
        console.error(requestError);
        setError("Не удалось загрузить данные пользователя");
      })
      .finally(() => setLoadingInitial(false));
  }, [id]);

  const calculateAge = useCallback((birthDate: string): number | null => {
    if (!birthDate) {
      return null;
    }

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }

    return age;
  }, []);

  const resolveFieldStatus = useCallback(
    (fieldName: ValidatedFieldName) => getFieldStatus(fieldName, formData, errors),
    [errors, formData],
  );

  const updateFieldError = useCallback((name: string, value: unknown) => {
    const fieldName = name as ValidatedFieldName;
    if (!["firstName", "lastName", "jerseyNumber", "height", "weight", "birthDate"].includes(fieldName)) {
      return;
    }

    const fieldError = validateField(fieldName, value);
    setErrors((previous) => ({ ...previous, [fieldName]: fieldError }));
  }, []);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;

      setErrors((previous) => ({ ...previous, [name]: undefined }));
      setError(null);
      setSuccessMessage(null);

      if (name === "jerseyNumber" || name === "height" || name === "weight") {
        const numericValue = value === "" ? null : Number.parseInt(value, 10);
        setFormData((previous) => ({ ...previous, [name]: numericValue }));
        updateFieldError(name, numericValue);
        return;
      }

      if (name === "primaryPosition" || name === "handedness") {
        const numericValue = Number.parseInt(value, 10);
        setFormData((previous) => ({ ...previous, [name]: numericValue }));
        return;
      }

      if (name === "birthDate") {
        const normalizedValue = value || null;
        setFormData((previous) => ({ ...previous, [name]: normalizedValue }));
        updateFieldError(name, normalizedValue);
        return;
      }

      setFormData((previous) => ({ ...previous, [name]: value }));
      updateFieldError(name, value);
    },
    [updateFieldError],
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    const firstNameError = validateField("firstName", formData.firstName);
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateField("lastName", formData.lastName);
    if (lastNameError) newErrors.lastName = lastNameError;

    if (formData.jerseyNumber !== null && formData.jerseyNumber !== undefined) {
      const jerseyError = validateField("jerseyNumber", formData.jerseyNumber);
      if (jerseyError) newErrors.jerseyNumber = jerseyError;
    }

    if (formData.height !== null && formData.height !== undefined) {
      const heightError = validateField("height", formData.height);
      if (heightError) newErrors.height = heightError;
    }

    if (formData.weight !== null && formData.weight !== undefined) {
      const weightError = validateField("weight", formData.weight);
      if (weightError) newErrors.weight = weightError;
    }

    if (formData.birthDate !== null && formData.birthDate !== undefined) {
      const birthDateError = validateField("birthDate", formData.birthDate);
      if (birthDateError) newErrors.birthDate = birthDateError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!id) {
        setError("Некорректный ID пользователя");
        return;
      }

      if (!validateForm()) {
        setError("Пожалуйста, исправьте ошибки в форме");
        return;
      }

      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const updatedUser = await updateUser(id, formData);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        setSuccessMessage("✅ Профиль обновлён");
        setTimeout(() => navigate("/settings"), 700);
      } catch (submitError) {
        const message =
          submitError instanceof Error
            ? submitError.message
            : "Произошла ошибка при сохранении профиля";
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [formData, id, navigate, validateForm],
  );

  if (loadingInitial) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#666" }}>
        Загрузка данных пользователя...
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", minHeight: "100vh", backgroundColor: "#f5f5f5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", boxSizing: "border-box" }}>
      <FormHeader
        onBack={() => navigate("/settings")}
        title="Редактирование профиля"
        subtitle="Обновите данные игрока"
      />
      {error && <ErrorMessage error={error} />}
      {successMessage && (
        <div style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px" }}>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <PersonalInfoForm
          formData={formData}
          errors={errors}
          getFieldStatus={resolveFieldStatus}
          onChange={handleChange}
          calculateAge={calculateAge}
        />
        <HockeyInfoForm
          formData={formData}
          errors={errors}
          getFieldStatus={resolveFieldStatus}
          onChange={handleChange}
        />
        <PlayerFormActions
          submitting={submitting}
          onCancel={() => navigate("/settings")}
          submitText="Сохранить изменения"
          submittingText="Сохраняем..."
        />
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

export default UpdateUserPage;
