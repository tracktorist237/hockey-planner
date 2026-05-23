import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchSpbhlPlayers, SpbhlPlayerSearchItem } from "src/api/spbhl";
import { PlayerAvatar } from "src/components/PlayerAvatar";
import { ErrorMessage } from "src/pages/CreatePlayerFormPage/components/ErrorMessage";
import { FormHeader } from "src/pages/CreatePlayerFormPage/components/FormHeader";
import { HockeyInfoForm } from "src/pages/CreatePlayerFormPage/components/HockeyInfoForm";
import { PersonalInfoForm } from "src/pages/CreatePlayerFormPage/components/PersonalInfoForm";
import { PlayerFormActions } from "src/pages/CreatePlayerFormPage/components/PlayerFormActions";
import { usePlayerForm } from "src/pages/CreatePlayerFormPage/hooks/usePlayerForm";
import { normalizeSpbhlBirthDateForInput } from "src/utils/spbhl";
import { getAdaptiveFontSize } from "src/utils/text";

const getSpbhlAvatarUrl = (playerId: string, size: "M" | "O" = "O") =>
  `https://spbhl.ru/ImageHandler.ashx?ID=${playerId}&Size=${size}&TableName=Player`;

const isValidBirthYear = (value: string): boolean => /^\d{4}$/.test(value);

export function CreatePlayerFormPage() {
  const navigate = useNavigate();
  const { formData, errors, submitting, error, handleChange, setBirthDate, handleSubmit, calculateAge, getFieldStatus } =
    usePlayerForm({ onSuccess: () => navigate("/events") });

  const [spbhlPlayerId, setSpbhlPlayerId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [localAvatarFile, setLocalAvatarFile] = useState<File | null>(null);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isSpbhlModalOpen, setIsSpbhlModalOpen] = useState(false);
  const [spbhlSearchName, setSpbhlSearchName] = useState("");
  const [spbhlBirthYear, setSpbhlBirthYear] = useState("");
  const [spbhlPage, setSpbhlPage] = useState(1);
  const [spbhlTotalPages, setSpbhlTotalPages] = useState(1);
  const [spbhlResults, setSpbhlResults] = useState<SpbhlPlayerSearchItem[]>([]);
  const [spbhlLoading, setSpbhlLoading] = useState(false);
  const [spbhlError, setSpbhlError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localAvatarPreview) {
        URL.revokeObjectURL(localAvatarPreview);
      }
    };
  }, [localAvatarPreview]);

  const openSpbhlModal = () => {
    setIsSpbhlModalOpen(true);
    setSpbhlError(null);
    setSpbhlResults([]);
    setSpbhlPage(1);
    setSpbhlTotalPages(1);
    setSpbhlSearchName((formData.lastName ?? "").trim());
  };

  const runSpbhlSearch = async (page: number, overrideName?: string) => {
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
    } catch (requestError) {
      setSpbhlError(requestError instanceof Error ? requestError.message : "Ошибка поиска СПБХЛ");
    } finally {
      setSpbhlLoading(false);
    }
  };

  const handleBindSpbhlPlayer = (player: SpbhlPlayerSearchItem) => {
    const birthDate = normalizeSpbhlBirthDateForInput(player.birthDate);
    setSpbhlPlayerId(player.playerId);
    if (birthDate) {
      setBirthDate(birthDate);
    }
    setPhotoUrl(player.photoLargeUrl || getSpbhlAvatarUrl(player.playerId, "O"));
    setLocalAvatarFile(null);
    if (localAvatarPreview) {
      URL.revokeObjectURL(localAvatarPreview);
      setLocalAvatarPreview(null);
    }
    setIsSpbhlModalOpen(false);
    setSuccessMessage(`Профиль СПБХЛ привязан: ${player.fullName}`);
  };

  const handleUploadLocalAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (localAvatarPreview) {
      URL.revokeObjectURL(localAvatarPreview);
    }

    const preview = URL.createObjectURL(file);
    setLocalAvatarFile(file);
    setLocalAvatarPreview(preview);
    setPhotoUrl(null);
    setSuccessMessage("Свой аватар подготовлен к загрузке");
  };

  const currentAvatarSrc = localAvatarPreview ?? photoUrl ?? undefined;

  return (
    <div style={{ padding: "16px", minHeight: "100vh", backgroundColor: "var(--hp-surface-soft)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", boxSizing: "border-box" }}>
      <FormHeader onBack={() => navigate("/")} />
      {error && <ErrorMessage error={error} />}
      {successMessage && (
        <div style={{ backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px" }}>
          {successMessage}
        </div>
      )}

      <form
        onSubmit={(event) =>
          void handleSubmit(event, {
            spbhlPlayerId,
            photoUrl: localAvatarFile ? null : photoUrl,
            avatarFile: localAvatarFile,
          })
        }
      >
        <PersonalInfoForm formData={formData} errors={errors} getFieldStatus={getFieldStatus} onChange={handleChange} calculateAge={calculateAge} />
        <HockeyInfoForm formData={formData} errors={errors} getFieldStatus={getFieldStatus} onChange={handleChange} />

        <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "var(--hp-heading)" }}>Привязка СПБХЛ и аватар</h3>

          <div style={{ marginBottom: "12px", fontSize: "14px", color: "var(--hp-muted)" }}>
            Профиль СПБХЛ: {spbhlPlayerId ? `привязан (${spbhlPlayerId.slice(0, 8)}...)` : "не привязан"}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
            <PlayerAvatar
              size={82}
              shape="rounded"
              photoUrl={currentAvatarSrc}
              jerseyNumber={formData.jerseyNumber}
              fallbackPrefix="#"
              badgePrefix="#"
              fallbackBg="var(--hp-primary)"
              fallbackColor="#fff"
              fontSize={18}
            />
            <div style={{ fontSize: "14px", color: "var(--hp-muted)", lineHeight: 1.4 }}>
              {currentAvatarSrc
                ? "Аватар будет сохранён при создании игрока."
                : "Можно привязать СПБХЛ и взять фото, либо загрузить свою картинку."}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
            <button
              type="button"
              onClick={openSpbhlModal}
              style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #1e88e5", backgroundColor: "var(--hp-primary-soft)", color: "var(--hp-primary-text)", fontWeight: 600, cursor: "pointer" }}
            >
              {spbhlPlayerId ? "Изменить привязку СПБХЛ" : "Привязать СПБХЛ"}
            </button>

            <label style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-surface)", color: "var(--hp-text)", fontWeight: 600, cursor: "pointer" }}>
              Загрузить свой аватар
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleUploadLocalAvatar} style={{ display: "none" }} />
            </label>

            <button
              type="button"
              onClick={() => {
                if (localAvatarPreview) {
                  URL.revokeObjectURL(localAvatarPreview);
                }
                setLocalAvatarPreview(null);
                setLocalAvatarFile(null);
                setPhotoUrl(null);
                setSpbhlPlayerId(null);
              }}
              style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #ffcdd2", backgroundColor: "#ffebee", color: "#c62828", fontWeight: 600, cursor: "pointer" }}
            >
              Очистить
            </button>
          </div>
        </div>

        <PlayerFormActions submitting={submitting} onCancel={() => navigate("/")} />
      </form>

      {isSpbhlModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}>
          <div style={{ width: "100%", maxWidth: "760px", maxHeight: "92vh", backgroundColor: "var(--hp-surface)", borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #eceff1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--hp-heading)", marginBottom: "2px" }}>Поиск игрока СПБХЛ</div>
                <div style={{ fontSize: "13px", color: "var(--hp-muted)" }}>Выберите игрока для привязки.</div>
              </div>
              <button type="button" onClick={() => setIsSpbhlModalOpen(false)} style={{ width: "34px", height: "34px", borderRadius: "8px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-surface)", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>
                ×
              </button>
            </div>

            <div style={{ padding: "14px 16px", borderBottom: "1px solid #eceff1" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  value={spbhlSearchName}
                  onChange={(event) => setSpbhlSearchName(event.target.value)}
                  placeholder="Фамилия или ФИО"
                  style={{ flex: "1 1 240px", minWidth: "180px", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--hp-border)", fontSize: "14px" }}
                />
                <input
                  value={spbhlBirthYear}
                  onChange={(event) => setSpbhlBirthYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                  placeholder="Год рождения"
                  inputMode="numeric"
                  style={{ width: "130px", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--hp-border)", fontSize: "14px" }}
                />
                <button type="button" onClick={() => void runSpbhlSearch(1)} disabled={spbhlLoading} style={{ padding: "10px 14px", borderRadius: "10px", border: "none", backgroundColor: spbhlLoading ? "#90caf9" : "var(--hp-primary)", color: "white", fontWeight: 600, cursor: spbhlLoading ? "wait" : "pointer" }}>
                  {spbhlLoading ? "Поиск..." : "Найти"}
                </button>
              </div>
              {spbhlError && <div style={{ marginTop: "8px", color: "#c62828", fontSize: "13px" }}>{spbhlError}</div>}
            </div>

            <div style={{ overflowY: "auto", padding: "12px 16px", flex: 1 }}>
              {!spbhlLoading && spbhlResults.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#607d8b", border: "1px dashed #cfd8dc", borderRadius: "12px" }}>
                  Результатов нет. Уточните ФИО или год рождения.
                </div>
              )}

              {spbhlResults.map((player) => (
                <div key={player.playerId} style={{ border: "1px solid #e3e8ef", borderRadius: "12px", padding: "10px", marginBottom: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                  <img src={player.photoSmallUrl} alt={player.fullName} style={{ width: "56px", height: "56px", borderRadius: "10px", objectFit: "cover", backgroundColor: "#eceff1", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#1f2937",
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
                    <div style={{ fontSize: "13px", color: "#607d8b" }}>{player.birthDate ? `Дата рождения: ${player.birthDate}` : "Дата рождения: —"}</div>
                    <div style={{ fontSize: "13px", color: "#607d8b" }}>
                      {player.teamName ? `Команда: ${player.teamName}` : "Команда: —"}
                      {player.jerseyNumber ? ` · №${player.jerseyNumber}` : ""}
                    </div>
                  </div>
                  <button type="button" onClick={() => handleBindSpbhlPlayer(player)} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #bbdefb", backgroundColor: "var(--hp-primary-soft)", color: "var(--hp-primary-text)", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                    Привязать
                  </button>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #eceff1", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <button type="button" onClick={() => void runSpbhlSearch(Math.max(1, spbhlPage - 1))} disabled={spbhlLoading || spbhlPage <= 1} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-surface)", color: spbhlPage <= 1 ? "var(--hp-muted)" : "var(--hp-text)", cursor: spbhlPage <= 1 ? "not-allowed" : "pointer" }}>
                ← Назад
              </button>
              <div style={{ fontSize: "13px", color: "#546e7a" }}>Страница {spbhlPage} из {spbhlTotalPages}</div>
              <button type="button" onClick={() => void runSpbhlSearch(Math.min(spbhlTotalPages, spbhlPage + 1))} disabled={spbhlLoading || spbhlPage >= spbhlTotalPages} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--hp-border)", backgroundColor: "var(--hp-surface)", color: spbhlPage >= spbhlTotalPages ? "var(--hp-muted)" : "var(--hp-text)", cursor: spbhlPage >= spbhlTotalPages ? "not-allowed" : "pointer" }}>
                Вперёд →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          input:focus, select:focus { outline: none; border-color: var(--hp-primary) !important; box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1); }
          input[type="date"] { appearance: none; -webkit-appearance: none; padding: 14px; font-family: inherit; }
          input[type="date"]::-webkit-calendar-picker-indicator { padding: 8px; margin-right: -8px; cursor: pointer; }
          @media (max-width: 360px) { div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 12px !important; } div[style*="padding: 20px"] { padding: 16px !important; } button[style*="padding: 16px 24px"] { padding: 14px 20px !important; } }
          @media (min-width: 768px) { div[style*="minHeight: 100vh"] { max-width: 600px; margin: 0 auto; border-left: 1px solid var(--hp-border); border-right: 1px solid var(--hp-border); min-height: 100vh; } }
        `}
      </style>
    </div>
  );
}

export default CreatePlayerFormPage;
