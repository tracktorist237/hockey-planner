import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTeams } from "src/api/teams";
import { BottomNav } from "src/components/BottomNav";
import { CurrentPlayerHeader } from "src/CurrentPlayerHeader";
import { User } from "src/types/user";
import { EventCard } from "./components/EventCard";
import { TeamSwitcher } from "./components/TeamSwitcher";
import { useEventsData } from "./hooks/useEventsData";

interface EventsListPageProps {
  currentUser: User | null;
  currentTeamId: string | null;
  currentTeamName: string | null;
  onTeamChange: (teamId: string | null, teamName?: string | null) => void;
}

export const EventsListPage = ({
  currentUser,
  currentTeamId,
  currentTeamName,
  onTeamChange,
}: EventsListPageProps) => {
  const navigate = useNavigate();
  const { events, loading, error, reloadEvents } = useEventsData(currentUser?.id, currentTeamId);
  const [canManageTeamEvents, setCanManageTeamEvents] = useState(false);
  const canCreateEvents = canManageTeamEvents;

  useEffect(() => {
    if (!currentUser?.id) {
      setCanManageTeamEvents(false);
      return;
    }

    void getMyTeams(currentUser.id)
      .then((teams) => setCanManageTeamEvents(teams.some((team) => team.myRole === 1 || team.myRole === 2)))
      .catch(() => setCanManageTeamEvents(false));
  }, [currentUser?.id]);

  const handleOpenEvent = useCallback(
    (eventId: string) => {
      navigate(`/events/${eventId}`);
    },
    [navigate],
  );

  return (
    <div
      style={{
        padding: "0",
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        color: "var(--hp-text)",
        boxSizing: "border-box",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--hp-surface)",
          padding: "16px",
          borderBottom: "1px solid var(--hp-border)",
          boxShadow: "var(--hp-shadow-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <h1
            style={{
              margin: "0",
              fontSize: "20px",
              fontWeight: "600",
              color: "var(--hp-heading)",
            }}
          >
            Мероприятия
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            {canCreateEvents && (
              <button
                onClick={() => navigate("/events/create")}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "var(--hp-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: "20px" }}>+</span>
                <span>Добавить</span>
              </button>
            )}
          </div>
        </div>

        <CurrentPlayerHeader />
        <TeamSwitcher
          currentUserId={currentUser?.id}
          currentTeamId={currentTeamId}
          currentTeamName={currentTeamName}
          onTeamChange={onTeamChange}
          filterOnly
        />
      </div>

      <div style={{ padding: "16px" }}>
        {loading ? (
          <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--hp-muted)" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid var(--hp-border)",
                borderTopColor: "var(--hp-primary)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px auto",
              }}
            />
            <div style={{ fontSize: "16px", fontWeight: "500" }}>Загрузка мероприятий...</div>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "15px",
              borderLeft: "4px solid #c62828",
            }}
          >
            <div style={{ marginBottom: "12px" }}>⚠️ {error}</div>
            <button
              onClick={() => void reloadEvents()}
              disabled={loading}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #ef9a9a",
                backgroundColor: loading ? "#ffcdd2" : "var(--hp-surface)",
                color: "#b71c1c",
                fontWeight: "600",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Обновление..." : "Обновить"}
            </button>
          </div>
        ) : events.length > 0 ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ margin: "0", fontSize: "18px", fontWeight: "600", color: "var(--hp-text)" }}>
                Предстоящие мероприятия
              </h2>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--hp-muted)",
                  backgroundColor: "var(--hp-surface-muted)",
                  padding: "4px 10px",
                  borderRadius: "12px",
                }}
              >
                {events.length}
              </div>
            </div>

            {events.map((event) => (
              <EventCard key={event.id} event={event} onOpen={handleOpenEvent} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              backgroundColor: "var(--hp-surface)",
              borderRadius: "16px",
              border: "1px solid var(--hp-border)",
              marginTop: "24px",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>🗓️</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "600", color: "var(--hp-text)" }}>
              Нет предстоящих мероприятий
            </h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "15px", color: "var(--hp-muted)", lineHeight: "1.5" }}>
              Здесь будут отображаться предстоящие тренировки, матчи и встречи
            </p>
            {canCreateEvents && (
              <button
                onClick={() => navigate("/events/create")}
                style={{
                  padding: "14px 24px",
                  backgroundColor: "var(--hp-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Создать первое мероприятие
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav activeTab="events" />
      <div style={{ height: "110px" }} />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @media (max-width: 360px) {
            div[style*="padding: 16px"] {
              padding: 12px !important;
            }

            button[style*="padding: 10px 16px"] {
              padding: 8px 12px !important;
              font-size: 13px !important;
            }
          }

          @media (min-width: 768px) {
            div[style*="minHeight: 100vh"] {
              max-width: 600px;
              margin: 0 auto;
              border-left: 1px solid var(--hp-border);
              border-right: 1px solid var(--hp-border);
              min-height: 100vh;
            }

            div[style*="position: fixed"] {
              position: static !important;
              border-top: 1px solid var(--hp-border);
              margin-top: 32px;
              box-shadow: none !important;
            }

            div[style*="height: 80px"] {
              height: 0 !important;
            }
          }

          @supports (padding: max(0px)) {
            div[style*="position: fixed"] {
              padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
            }
          }
        `}
      </style>
    </div>
  );
};
