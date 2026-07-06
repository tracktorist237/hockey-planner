import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserPrivacySettings,
  updateUserPrivacySettings,
  UserDataVisibility,
  UserPrivacySettings,
} from "src/api/users";
import { InternalPageHeader } from "src/components/InternalPageHeader";
import { LoadingIndicator } from "src/components/LoadingIndicator";
import { useAuth } from "src/hooks/useAuth";

type PrivacyFieldKey =
  | "emailVisibility"
  | "phoneVisibility"
  | "birthDateVisibility"
  | "physicalVisibility"
  | "hockeyProfileVisibility"
  | "spbhlProfileVisibility";

const visibilityOptions = [
  { value: UserDataVisibility.Teammates, label: "Сокомандники", description: "Участники ваших команд" },
  { value: UserDataVisibility.TeamAdmins, label: "Админы команды", description: "Owner/admin общих команд" },
  { value: UserDataVisibility.Everyone, label: "Все", description: "Любой пользователь приложения" },
  { value: UserDataVisibility.Nobody, label: "Никто", description: "Только вы и суперадмин" },
];

const fields: Array<{ key: PrivacyFieldKey; title: string; description: string }> = [
  {
    key: "emailVisibility",
    title: "Email",
    description: "Почта в карточке игрока.",
  },
  {
    key: "phoneVisibility",
    title: "Телефон",
    description: "Номер телефона для связи.",
  },
  {
    key: "birthDateVisibility",
    title: "Дата рождения",
    description: "Дата рождения и возраст.",
  },
  {
    key: "physicalVisibility",
    title: "Рост и вес",
    description: "Антропометрия в профиле игрока.",
  },
  {
    key: "hockeyProfileVisibility",
    title: "Хоккейный профиль",
    description: "Позиция и хват.",
  },
  {
    key: "spbhlProfileVisibility",
    title: "Профиль СПБХЛ",
    description: "Ссылка на внешний профиль игрока.",
  },
];

const cardStyle = {
  backgroundColor: "var(--hp-surface)",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "var(--hp-shadow-sm)",
} as const;

const selectStyle = {
  width: "100%",
  border: "1px solid var(--hp-border)",
  borderRadius: "12px",
  padding: "12px",
  backgroundColor: "var(--hp-input-bg)",
  color: "var(--hp-text)",
  fontSize: "15px",
  fontWeight: 800,
  boxSizing: "border-box",
} as const;

export function PrivacySettingsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? null;
  const [settings, setSettings] = useState<UserPrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    void getUserPrivacySettings(currentUserId, currentUserId)
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить настройки.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUserId]);

  const selectedLabels = useMemo(() => {
    const map = new Map<UserDataVisibility, string>();
    visibilityOptions.forEach((option) => map.set(option.value, option.label));
    return map;
  }, []);

  const handleChange = (key: PrivacyFieldKey, value: UserDataVisibility) => {
    setSettings((previous) => (previous ? { ...previous, [key]: value } : previous));
    setMessage(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!currentUserId || !settings) return;

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      setSettings(await updateUserPrivacySettings(currentUserId, currentUserId, settings));
      setMessage("Настройки приватности сохранены.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить настройки.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        color: "var(--hp-text)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <InternalPageHeader title="Приватность" onBack={() => navigate("/settings")} />

      <main style={{ padding: "16px", paddingBottom: "32px", display: "grid", gap: "14px" }}>
        <section style={cardStyle}>
          <h2 style={{ margin: "0 0 6px", color: "var(--hp-heading)", fontSize: 18 }}>Кто видит мои данные</h2>
          <div style={{ color: "var(--hp-muted)", fontSize: 14, lineHeight: 1.45 }}>
            Эти настройки применяются к карточкам игрока для других пользователей. Суперадмин в админ-панели всё равно видит данные для поддержки сервиса.
          </div>
        </section>

        {loading && <LoadingIndicator text="Загружаем настройки..." />}

        {!loading && error && (
          <div style={{ ...cardStyle, border: "1px solid var(--hp-danger-border)", color: "var(--hp-danger)", backgroundColor: "var(--hp-danger-soft)" }}>
            {error}
          </div>
        )}

        {!loading && settings && (
          <>
            <section style={{ display: "grid", gap: "10px" }}>
              {fields.map((field) => (
                <label key={field.key} style={{ ...cardStyle, display: "grid", gap: "10px" }}>
                  <span style={{ display: "grid", gap: "3px" }}>
                    <span style={{ color: "var(--hp-heading)", fontWeight: 900, fontSize: 16 }}>{field.title}</span>
                    <span style={{ color: "var(--hp-muted)", fontSize: 13, lineHeight: 1.35 }}>{field.description}</span>
                  </span>
                  <select
                    value={settings[field.key]}
                    onChange={(event) => handleChange(field.key, Number(event.target.value) as UserDataVisibility)}
                    style={selectStyle}
                  >
                    {visibilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span style={{ color: "var(--hp-muted)", fontSize: 12 }}>
                    Сейчас: {selectedLabels.get(settings[field.key]) ?? "Не выбрано"}
                  </span>
                </label>
              ))}
            </section>

            {message && (
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid var(--hp-success-border)", background: "var(--hp-success-soft)", color: "var(--hp-success)", fontWeight: 900 }}>
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              style={{
                border: 0,
                borderRadius: 14,
                padding: "14px 16px",
                background: saving ? "var(--hp-muted)" : "var(--hp-primary)",
                color: "white",
                fontSize: 16,
                fontWeight: 900,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.72 : 1,
              }}
            >
              {saving ? "Сохраняем..." : "Сохранить настройки"}
            </button>
          </>
        )}
      </main>

      <style>
        {`
          @media (min-width: 768px) {
            div[style*="minHeight: 100vh"] {
              max-width: 600px;
              margin: 0 auto;
              border-left: 1px solid var(--hp-border);
              border-right: 1px solid var(--hp-border);
            }
          }
        `}
      </style>
    </div>
  );
}
