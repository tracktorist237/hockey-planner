import { useCallback, useState } from "react";
import { createUser, User } from "src/api/users";
import { getFieldStatus, validateField } from "src/pages/CreatePlayerFormPage/validation";
import { UserFormData, ValidationErrors, ValidatedFieldName } from "src/pages/CreatePlayerFormPage/types";

interface UsePlayerFormOptions {
  onSuccess?: (user: User) => void;
}

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

export const usePlayerForm = ({ onSuccess }: UsePlayerFormOptions = {}) => {
  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFieldError = useCallback((name: string, value: unknown) => {
    const fieldName = name as ValidatedFieldName;
    if (!["firstName", "lastName", "jerseyNumber", "height", "weight", "birthDate"].includes(fieldName)) {
      return;
    }

    const fieldError = validateField(fieldName, value);
    setErrors((previous) => ({ ...previous, [fieldName]: fieldError }));
  }, []);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setError(null);

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
  }, [updateFieldError]);

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

  const handleSubmit = useCallback(async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!validateForm()) {
      setError("Пожалуйста, исправьте ошибки в форме");
      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      const createdUser = await createUser(formData);
      localStorage.setItem("currentUser", JSON.stringify(createdUser));
      onSuccess?.(createdUser);
      return true;
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Произошла ошибка при создании анкеты";
      setError(message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [formData, onSuccess, validateForm]);

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

  return {
    formData,
    errors,
    submitting,
    error,
    handleChange,
    handleSubmit,
    calculateAge,
    getFieldStatus: resolveFieldStatus,
  };
};
