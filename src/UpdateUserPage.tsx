import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { searchSpbhlPlayers, SpbhlPlayerSearchItem } from "src/api/spbhl";
import {
  getUserById,
  updateUser,
  uploadUserAvatar,
  User,
  UpdateUserData,
} from "src/api/users";
import { normalizeRole } from "src/constants/roles";
import { useAuth } from "src/hooks/useAuth";
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
import {
  getFieldStatus,
  validateField,
} from "src/pages/CreatePlayerFormPage/validation";
import { User as AuthUser } from "src/types/user";
import { getAdaptiveFontSize } from "src/utils/text";
import { markOnboardingCompleted } from "src/utils/onboarding";

const SPBHL_PROFILE_URL = "https://spbhl.ru/Player?PlayerID=";
const getSpbhlAvatarUrl = (playerId: string, size: "M" | "O" = "O") =>
  `https://spbhl.ru/ImageHandler.ashx?ID=${playerId}&Size=${size}&TableName=Player`;

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

const isValidBirthYear = (value: string): boolean => /^\d{4}$/.test(value);

export function UpdateUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { currentUser, setCurrentUser } = useAuth();
  const nextPath = searchParams.get("next") || "/settings";

  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [spbhlPlayerId, setSpbhlPlayerId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [isSpbhlModalOpen, setIsSpbhlModalOpen] = useState(false);
  const [spbhlSearchName, setSpbhlSearchName] = useState("");
  const [spbhlBirthYear, setSpbhlBirthYear] = useState("");
  const [spbhlPage, setSpbhlPage] = useState(1);
  const [spbhlTotalPages, setSpbhlTotalPages] = useState(1);
  const [spbhlResults, setSpbhlResults] = useState<SpbhlPlayerSearchItem[]>([]);
  const [spbhlLoading, setSpbhlLoading] = useState(false);
  const [spbhlError, setSpbhlError] = useState<string | null>(null);

  const linkedSpbhlAvatarUrl = useMemo(() => {
    if (!spbhlPlayerId) {
      return null;
    }

    return getSpbhlAvatarUrl(spbhlPlayerId, "O");
  }, [spbhlPlayerId]);

  const resolveFieldStatus = useCallback(
    (fieldName: ValidatedFieldName) => getFieldStatus(fieldName, formData, errors),
    [errors, formData],
  );

  const mapToAuthUser = useCallback(
    (user: User): AuthUser => ({
      id: user.id,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      jerseyNumber: user.jerseyNumber ?? null,
      fullName: user.fullName ?? `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim(),
      photoUrl: user.photoUrl ?? null,
      spbhlPlayerId: user.spbhlPlayerId ?? null,
      email: currentUser?.email ?? null,
      emailConfirmed: Boolean(currentUser?.emailConfirmed),
      role: normalizeRole(user.role ?? currentUser?.role),
    }),
    [currentUser?.email, currentUser?.emailConfirmed, currentUser?.role],
  );

  const syncCurrentUser = useCallback(
    (user: User) => {
      const mappedUser = mapToAuthUser(user);
      if (currentUser?.id === mappedUser.id) {
        setCurrentUser(mappedUser);
      }
    },
    [currentUser?.id, mapToAuthUser, setCurrentUser],
  );

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
        setPhotoUrl(user.photoUrl ?? null);
        setSpbhlPlayerId(user.spbhlPlayerId ?? null);
        setSpbhlSearchName((user.lastName ?? "").trim());
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

  const updateFieldError = useCallback((name: string, value: unknown) => {
    const fieldName = name as ValidatedFieldName;
    if (
      !["firstName", "lastName", "jerseyNumber", "height", "weight", "birthDate"].includes(
        fieldName,
      )
    ) {
      return;
    }

    const fieldError = validateField(fieldName, value);
    setErrors((previous) => ({ ...previous, [fieldName]: fieldError }));
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (firstNameError) {
      newErrors.firstName = firstNameError;
    }

    const lastNameError = validateField("lastName", formData.lastName);
    if (lastNameError) {
      newErrors.lastName = lastNameError;
    }

    if (formData.jerseyNumber !== null && formData.jerseyNumber !== undefined) {
      const jerseyError = validateField("jerseyNumber", formData.jerseyNumber);
      if (jerseyError) {
        newErrors.jerseyNumber = jerseyError;
      }
    }

    if (formData.height !== null && formData.height !== undefined) {
      const heightError = validateField("height", formData.height);
      if (heightError) {
        newErrors.height = heightError;
      }
    }

    if (formData.weight !== null && formData.weight !== undefined) {
      const weightError = validateField("weight", formData.weight);
      if (weightError) {
        newErrors.weight = weightError;
      }
    }

    if (formData.birthDate !== null && formData.birthDate !== undefined) {
      const birthDateError = validateField("birthDate", formData.birthDate);
      if (birthDateError) {
        newErrors.birthDate = birthDateError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const runSpbhlSearch = useCallback(
    async (page: number, overrideName?: string) => {
      const queryName = (overrideName ?? spbhlSearchName ?? formData.lastName ?? "").trim();
      if (!queryName) {
        setSpbhlError("Введите фамилию или ФИО для поиска");
        setSpbhlResults([]);
        return;
      }

      if (spbhlBirthYear && !isValidBirthYear(spbhlBirthYear)) {
        setSpbhlError("Год рождения должен содержать 4 цифры");
        return;
      }

      setSpbhlLoading(true);
      setSpbhlError(null);

      try {
        const response = await searchSpbhlPlayers({
          fullName: queryName,
          birthYear: spbhlBirthYear || undefined,
          page,
        });

        setSpbhlResults(response.players ?? []);
        setSpbhlPage(response.page ?? page);
        setSpbhlTotalPages(response.totalPages ?? 1);
      } catch (searchError) {
        const message =
          searchError instanceof Error
            ? searchError.message
            : "Не удалось выполнить поиск СПБХЛ";
        setSpbhlError(message);
      } finally {
        setSpbhlLoading(false);
      }
    },
    [formData.lastName, spbhlBirthYear, spbhlSearchName],
  );

  const openSpbhlModal = useCallback(() => {
    const defaultName = (spbhlSearchName || formData.lastName || "").trim();

    setIsSpbhlModalOpen(true);
    setSpbhlError(null);
    setSpbhlResults([]);
    setSpbhlPage(1);
    setSpbhlTotalPages(1);
    setSpbhlSearchName(defaultName);

    if (defaultName) {
      void runSpbhlSearch(1, defaultName);
    }
  }, [formData.lastName, runSpbhlSearch, spbhlSearchName]);

  const handleBindSpbhlPlayer = useCallback((player: SpbhlPlayerSearchItem) => {
    setSpbhlPlayerId(player.playerId);
    setIsSpbhlModalOpen(false);
    setSuccessMessage(`Профиль СПБХЛ привязан: ${player.fullName}`);
  }, []);

  const handleUnbindSpbhlPlayer = useCallback(() => {
    const oldSpbhlId = spbhlPlayerId;
    setSpbhlPlayerId(null);

    if (oldSpbhlId && photoUrl?.includes(oldSpbhlId)) {
      setPhotoUrl(null);
    }

    setSuccessMessage("Привязка к СПБХЛ удалена");
  }, [photoUrl, spbhlPlayerId]);

  const handleUseSpbhlAvatar = useCallback(() => {
    if (!spbhlPlayerId) {
      setError("Сначала привяжите профиль СПБХЛ");
      return;
    }

    setError(null);
    setPhotoUrl(getSpbhlAvatarUrl(spbhlPlayerId, "O"));
    setSuccessMessage("Аватар из СПБХЛ выбран");
  }, [spbhlPlayerId]);

  const handleUploadCustomAvatar = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!id) {
        setError("Некорректный ID пользователя");
        return;
      }

      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      setIsUploadingAvatar(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const updatedUser = await uploadUserAvatar(id, file);
        setPhotoUrl(updatedUser.photoUrl ?? null);
        syncCurrentUser(updatedUser);
        setSuccessMessage("Свой аватар загружен");
      } catch (uploadError) {
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : "Не удалось загрузить аватар";
        setError(message);
      } finally {
        setIsUploadingAvatar(false);
      }
    },
    [id, syncCurrentUser],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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

      const payload: UpdateUserData = {
        ...formData,
        photoUrl,
        spbhlPlayerId,
      };

      try {
        const updatedUser = await updateUser(id, payload);
        markOnboardingCompleted(updatedUser.id);
        syncCurrentUser(updatedUser);
        setSuccessMessage("✅ Профиль обновлён");
        setTimeout(() => navigate(nextPath), 700);
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
    [formData, id, navigate, nextPath, photoUrl, spbhlPlayerId, syncCurrentUser, validateForm],
  );

  if (loadingInitial) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "var(--hp-muted)" }}>
        Загрузка данных пользователя...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <FormHeader
        onBack={() => navigate(nextPath)}
        title="Редактирование профиля"
        subtitle="Обновите данные игрока, привязку СПБХЛ и аватар"
      />

      {error && <ErrorMessage error={error} />}

      {successMessage && (
        <div
          style={{
            backgroundColor: "var(--hp-success-soft)",
            color: "var(--hp-success)",
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
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

        <div
          style={{
            backgroundColor: "var(--hp-surface)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "var(--hp-shadow-sm)",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", color: "var(--hp-heading)" }}>
            Профиль СПБХЛ
          </h3>
          <div style={{ color: "var(--hp-muted)", fontSize: "14px", marginBottom: "14px" }}>
            Привяжите игрока СПБХЛ, чтобы использовать его фото и в будущем подтягивать статистику.
          </div>

          <div
            style={{
              backgroundColor: "var(--hp-surface-soft)",
              border: "1px solid var(--hp-border)",
              borderRadius: "12px",
              padding: "12px",
              marginBottom: "12px",
              fontSize: "14px",
              wordBreak: "break-word",
            }}
          >
            {spbhlPlayerId ? (
              <>
                <div style={{ marginBottom: "6px", color: "var(--hp-success)", fontWeight: 600 }}>
                  Профиль привязан
                </div>
                <div>ID: {spbhlPlayerId}</div>
              </>
            ) : (
              <div style={{ color: "var(--hp-muted)" }}>Профиль СПБХЛ не привязан</div>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button
              type="button"
              onClick={openSpbhlModal}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--hp-primary)",
                backgroundColor: "var(--hp-primary-soft)",
                color: "var(--hp-primary-text)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {spbhlPlayerId ? "Изменить привязку" : "Привязать профиль СПБХЛ"}
            </button>

            {spbhlPlayerId && (
              <>
                <button
                  type="button"
                  onClick={handleUnbindSpbhlPlayer}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--hp-danger-border)",
                    backgroundColor: "var(--hp-danger-soft)",
                    color: "var(--hp-danger)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Отвязать
                </button>

                <a
                  href={`${SPBHL_PROFILE_URL}${spbhlPlayerId}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--hp-border)",
                    backgroundColor: "var(--hp-surface)",
                    color: "var(--hp-text)",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Открыть профиль в СПБХЛ
                </a>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--hp-surface)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "var(--hp-shadow-sm)",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "var(--hp-heading)" }}>
            Аватар
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "14px",
                backgroundColor: "var(--hp-neutral-soft)",
                border: "1px solid var(--hp-border)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--hp-muted)",
                fontSize: "12px",
                textAlign: "center",
                padding: "8px",
              }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="avatar preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span>Аватар не установлен</span>
              )}
            </div>

            <div style={{ color: "var(--hp-muted)", fontSize: "14px", lineHeight: 1.4 }}>
              {photoUrl ? "Текущий аватар будет сохранён в профиль." : "Выберите источник аватара."}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button
              type="button"
              onClick={handleUseSpbhlAvatar}
              disabled={!spbhlPlayerId || !linkedSpbhlAvatarUrl}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--hp-success-border)",
                backgroundColor: !spbhlPlayerId ? "var(--hp-success-soft)" : "var(--hp-success-soft)",
                color: !spbhlPlayerId ? "var(--hp-muted)" : "var(--hp-success)",
                fontWeight: 600,
                cursor: !spbhlPlayerId ? "not-allowed" : "pointer",
              }}
            >
              Использовать аватар из СПБХЛ
            </button>

            <label
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--hp-border)",
                backgroundColor: "var(--hp-surface)",
                color: "var(--hp-text)",
                fontWeight: 600,
                cursor: isUploadingAvatar ? "not-allowed" : "pointer",
                opacity: isUploadingAvatar ? 0.7 : 1,
              }}
            >
              {isUploadingAvatar ? "Загрузка..." : "Загрузить свой"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleUploadCustomAvatar}
                disabled={isUploadingAvatar || submitting}
                style={{ display: "none" }}
              />
            </label>

            <button
              type="button"
              onClick={() => setPhotoUrl(null)}
              disabled={!photoUrl}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--hp-danger-border)",
                backgroundColor: !photoUrl ? "var(--hp-input-bg)" : "var(--hp-danger-soft)",
                color: !photoUrl ? "var(--hp-muted)" : "var(--hp-danger)",
                fontWeight: 600,
                cursor: !photoUrl ? "not-allowed" : "pointer",
              }}
            >
              Убрать аватар
            </button>
          </div>

          {!spbhlPlayerId && (
            <div style={{ marginTop: "10px", fontSize: "13px", color: "var(--hp-muted)" }}>
              Чтобы взять фото из СПБХЛ, сначала привяжите профиль.
            </div>
          )}
        </div>

        <PlayerFormActions
          submitting={submitting || isUploadingAvatar}
          onCancel={() => navigate(nextPath)}
          submitText="Сохранить изменения"
          submittingText="Сохраняем..."
        />
      </form>

      {isSpbhlModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 5000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "760px",
              maxHeight: "92vh",
              backgroundColor: "var(--hp-surface)",
              borderRadius: "16px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--hp-neutral-soft)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: "var(--hp-heading)", marginBottom: "2px" }}>
                  Поиск игрока СПБХЛ
                </div>
                <div style={{ fontSize: "13px", color: "var(--hp-muted)" }}>
                  Фамилия предзаполнена из профиля, можно уточнить год рождения.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSpbhlModalOpen(false)}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  border: "1px solid var(--hp-border)",
                  backgroundColor: "var(--hp-surface)",
                  cursor: "pointer",
                  fontSize: "18px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--hp-neutral-soft)" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  value={spbhlSearchName}
                  onChange={(event) => setSpbhlSearchName(event.target.value)}
                  placeholder="Фамилия или ФИО"
                  style={{
                    flex: "1 1 240px",
                    minWidth: "180px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--hp-border)",
                    fontSize: "14px",
                  }}
                />

                <input
                  value={spbhlBirthYear}
                  onChange={(event) =>
                    setSpbhlBirthYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))
                  }
                  placeholder="Год рождения"
                  inputMode="numeric"
                  style={{
                    width: "130px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--hp-border)",
                    fontSize: "14px",
                  }}
                />

                <button
                  type="button"
                  onClick={() => void runSpbhlSearch(1)}
                  disabled={spbhlLoading}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: spbhlLoading ? "var(--hp-primary-soft)" : "var(--hp-primary)",
                    color: "white",
                    fontWeight: 600,
                    cursor: spbhlLoading ? "wait" : "pointer",
                  }}
                >
                  {spbhlLoading ? "Поиск..." : "Найти"}
                </button>
              </div>

              {spbhlError && (
                <div style={{ marginTop: "8px", color: "var(--hp-danger)", fontSize: "13px" }}>
                  {spbhlError}
                </div>
              )}
            </div>

            <div style={{ overflowY: "auto", padding: "12px 16px", flex: 1 }}>
              {!spbhlLoading && spbhlResults.length === 0 && (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--hp-muted)",
                    border: "1px dashed var(--hp-border)",
                    borderRadius: "12px",
                  }}
                >
                  Результатов нет. Уточните ФИО или год рождения.
                </div>
              )}

              {spbhlResults.map((player) => {
                const isAlreadyLinked = spbhlPlayerId === player.playerId;
                return (
                  <div
                    key={player.playerId}
                    style={{
                      border: "1px solid var(--hp-border)",
                      borderRadius: "12px",
                      padding: "10px",
                      marginBottom: "10px",
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={player.photoSmallUrl}
                      alt={player.fullName}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "10px",
                        objectFit: "cover",
                        backgroundColor: "var(--hp-neutral-soft)",
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--hp-heading)",
                          marginBottom: "4px",
                          whiteSpace: "nowrap",
                          fontSize: `${getAdaptiveFontSize(player.fullName, {
                            base: 16,
                            min: 11,
                            startShrinkAt: 18,
                            maxLength: 42,
                          })}px`,
                        }}
                      >
                        {player.fullName}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--hp-muted)" }}>
                        {player.birthDate ? `Дата рождения: ${player.birthDate}` : "Дата рождения: —"}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--hp-muted)" }}>
                        {player.teamName ? `Команда: ${player.teamName}` : "Команда: —"}
                        {player.jerseyNumber ? ` · №${player.jerseyNumber}` : ""}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleBindSpbhlPlayer(player)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--hp-info-border)",
                          backgroundColor: isAlreadyLinked ? "var(--hp-success-soft)" : "var(--hp-primary-soft)",
                          color: isAlreadyLinked ? "var(--hp-success)" : "var(--hp-primary-text)",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isAlreadyLinked ? "Уже привязан" : "Привязать"}
                      </button>

                      <a
                        href={player.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "12px",
                          color: "var(--hp-muted)",
                          textAlign: "center",
                          textDecoration: "none",
                        }}
                      >
                        Профиль
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                borderTop: "1px solid var(--hp-neutral-soft)",
                padding: "10px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => void runSpbhlSearch(Math.max(1, spbhlPage - 1))}
                disabled={spbhlLoading || spbhlPage <= 1}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--hp-border)",
                  backgroundColor: "var(--hp-surface)",
                  color: spbhlPage <= 1 ? "var(--hp-muted)" : "var(--hp-text)",
                  cursor: spbhlPage <= 1 ? "not-allowed" : "pointer",
                }}
              >
                ← Назад
              </button>

              <div style={{ fontSize: "13px", color: "var(--hp-muted)" }}>
                Страница {spbhlPage} из {spbhlTotalPages}
              </div>

              <button
                type="button"
                onClick={() => void runSpbhlSearch(Math.min(spbhlTotalPages, spbhlPage + 1))}
                disabled={spbhlLoading || spbhlPage >= spbhlTotalPages}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--hp-border)",
                  backgroundColor: "var(--hp-surface)",
                  color: spbhlPage >= spbhlTotalPages ? "var(--hp-muted)" : "var(--hp-text)",
                  cursor: spbhlPage >= spbhlTotalPages ? "not-allowed" : "pointer",
                }}
              >
                Вперёд →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          input:focus,
          select:focus {
            outline: none;
            border-color: var(--hp-primary) !important;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
          }

          input[type="date"] {
            appearance: none;
            -webkit-appearance: none;
            padding: 14px;
            font-family: inherit;
          }

          input[type="date"]::-webkit-calendar-picker-indicator {
            padding: 8px;
            margin-right: -8px;
            cursor: pointer;
          }

          @media (max-width: 360px) {
            div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }

            div[style*="padding: 20px"] {
              padding: 16px !important;
            }

            button[style*="padding: 16px 24px"] {
              padding: 14px 20px !important;
            }
          }

          @media (min-width: 768px) {
            div[style*="minHeight: 100vh"] {
              max-width: 640px;
              margin: 0 auto;
              border-left: 1px solid var(--hp-border);
              border-right: 1px solid var(--hp-border);
              min-height: 100vh;
            }
          }
        `}
      </style>
    </div>
  );
}

export default UpdateUserPage;
