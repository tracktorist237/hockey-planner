import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getUsers, User as ApiUser } from "src/api/users";
import { useAuth } from "src/hooks/useAuth";
import { markOnboardingCompleted } from "src/utils/onboarding";

const getPlayerLabel = (user: ApiUser): string => {
  const name = `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim();
  const number = user.jerseyNumber ? `#${user.jerseyNumber} ` : "";
  return `${number}${name || "Без имени"}`;
};

export function LinkPlayerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, linkPlayer } = useAuth();
  const [players, setPlayers] = useState<ApiUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showEmailConfirmationNotice =
    searchParams.get("emailConfirmation") === "sent" || currentUser?.emailConfirmed === false;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getUsers()
      .then((data) => {
        if (isMounted) {
          setPlayers(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Не удалось загрузить список игроков.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const available = players.filter((player) => player.id !== currentUser?.id);
    const filtered = query
      ? available.filter((player) => getPlayerLabel(player).toLowerCase().includes(query))
      : available;

    return [...filtered].sort((a, b) => {
      const aLinked = Boolean(a.email);
      const bLinked = Boolean(b.email);
      if (aLinked !== bLinked) {
        return aLinked ? 1 : -1;
      }

      return getPlayerLabel(a).localeCompare(getPlayerLabel(b), "ru");
    });
  }, [currentUser?.id, players, search]);

  const handleLink = async () => {
    if (!selectedPlayer) {
      setError("Выберите себя из списка.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const linkedUser = await linkPlayer({ userId: selectedPlayer.id });
      markOnboardingCompleted(linkedUser.id);
      navigate(`/users/${linkedUser.id}/edit?next=/teams`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось привязать профиль.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px 14px",
        background: "var(--hp-bg-gradient)",
        color: "var(--hp-text)",
        boxSizing: "border-box",
      }}
    >
      <main
        style={{
          maxWidth: 520,
          margin: "0 auto",
          background: "var(--hp-surface)",
          borderRadius: 24,
          padding: 20,
          boxShadow: "var(--hp-shadow-md)",
          border: "1px solid var(--hp-border)",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 28, color: "var(--hp-text-strong)" }}>
          Найдите себя в списке команды
        </h1>
        <p style={{ margin: "0 0 18px", color: "var(--hp-muted)", fontSize: 16, lineHeight: 1.45 }}>
          Если вы уже были в команде, выберите себя. Мы привяжем email к старому профилю,
          и сохранятся номер, явка, аватарка и данные игрока.
        </p>

        {showEmailConfirmationNotice && (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 14,
              background: "#fff7ed",
              color: "#9a3412",
              border: "1px solid #fed7aa",
              fontSize: 15,
              lineHeight: 1.45,
              fontWeight: 700,
            }}
          >
            Мы отправили письмо для подтверждения почты. Подтвердите email, чтобы потом можно
            было восстановить пароль и не потерять доступ к профилю.
          </div>
        )}

        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSelectedPlayer(null);
          }}
          placeholder="Введите фамилию или номер"
          style={{
            width: "100%",
            borderRadius: 14,
            border: "1px solid var(--hp-border)",
            padding: "15px 14px",
            fontSize: 17,
            boxSizing: "border-box",
            marginBottom: 12,
          }}
        />

        {error && (
          <div style={{ marginBottom: 12, padding: 12, borderRadius: 14, background: "#fee2e2", color: "#991b1b" }}>
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gap: 8,
            marginBottom: 16,
            maxHeight: 360,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {loading && <div style={{ color: "var(--hp-muted)" }}>Загружаем игроков...</div>}
          {!loading &&
            filteredPlayers.map((player) => {
              const isLinked = Boolean(player.email);
              const isSelected = selectedPlayer?.id === player.id;

              return (
              <button
                type="button"
                key={player.id}
                onClick={() => {
                  if (isLinked) {
                    return;
                  }

                  setSelectedPlayer(player);
                  setSearch(getPlayerLabel(player));
                }}
                disabled={isLinked}
                style={{
                  textAlign: "left",
            border: isSelected ? "2px solid var(--hp-primary)" : "1px solid var(--hp-border)",
            borderRadius: 14,
            background: isSelected ? "var(--hp-primary-soft)" : isLinked ? "var(--hp-surface-soft)" : "var(--hp-surface)",
            color: isLinked ? "var(--hp-muted)" : "var(--hp-text-strong)",
                  padding: "13px 14px",
                  fontSize: 17,
                  fontWeight: 800,
                  cursor: isLinked ? "not-allowed" : "pointer",
                }}
              >
                <span>{getPlayerLabel(player)}</span>
                {isLinked && (
                  <span style={{ display: "block", marginTop: 4, fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>
                    Уже привязан к аккаунту
                  </span>
                )}
              </button>
              );
            })}
        </div>

        {selectedPlayer && (
          <div style={{ marginBottom: 14, padding: 12, borderRadius: 14, background: "#f0fdf4", color: "#166534", fontWeight: 800 }}>
            Выбран профиль: {getPlayerLabel(selectedPlayer)}
          </div>
        )}

        <button
          type="button"
          onClick={handleLink}
          disabled={submitting}
          style={{
            width: "100%",
            border: 0,
            borderRadius: 16,
            padding: "15px 16px",
            fontSize: 17,
            fontWeight: 900,
            cursor: submitting ? "wait" : "pointer",
            background: "linear-gradient(135deg, #0f766e, #2563eb)",
            color: "white",
            opacity: submitting ? 0.75 : 1,
          }}
        >
          {submitting ? "Привязываем..." : "Это я, привязать профиль"}
        </button>

        <button
          type="button"
          onClick={() => navigate(`/users/${currentUser?.id}/edit?next=/teams`, { replace: true })}
          style={{
            width: "100%",
            marginTop: 10,
            border: "1px solid var(--hp-border)",
            borderRadius: 16,
            padding: "14px 16px",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            background: "#f8fafc",
            color: "var(--hp-text)",
          }}
        >
          Меня нет в списке, заполнить профиль
        </button>
      </main>
    </div>
  );
}
