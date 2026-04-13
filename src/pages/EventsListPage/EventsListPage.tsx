import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CurrentPlayerHeader } from "../../CurrentPlayerHeader";
import { User } from "../../types/user";
import { EventCard } from "./components/EventCard";
import { useEventsData } from "./hooks/useEventsData";

interface EventsListPageProps {
  currentUser: User | null;
}

export const EventsListPage = ({ currentUser }: EventsListPageProps) => {
  const navigate = useNavigate();
  const { events, loading, error, reloadEvents } = useEventsData(currentUser?.id);

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
        backgroundColor: "#f5f5f5",
        boxSizing: "border-box",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "16px",
          borderBottom: "1px solid #e0e0e0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
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
              color: "#1a237e",
            }}
          >
            Мероприятия
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => navigate("/events/create")}
              style={{
                padding: "10px 16px",
                backgroundColor: "#1976d2",
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1565c0";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1976d2";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "20px" }}>+</span>
              <span>Добавить</span>
            </button>
          </div>
        </div>

        <CurrentPlayerHeader />
      </div>

      <div style={{ padding: "16px" }}>
        {loading ? (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              color: "#666",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid #e0e0e0",
                borderTopColor: "#1976d2",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px auto",
              }}
            />
            <div style={{ fontSize: "16px", fontWeight: "500" }}>
              Загрузка мероприятий...
            </div>
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
                backgroundColor: loading ? "#ffcdd2" : "white",
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
              <h2
                style={{
                  margin: "0",
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#333",
                }}
              >
                Предстоящие мероприятия
              </h2>
              <div
                style={{
                  fontSize: "14px",
                  color: "#666",
                  backgroundColor: "#f0f0f0",
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
              backgroundColor: "white",
              borderRadius: "16px",
              border: "1px solid #e0e0e0",
              marginTop: "24px",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                marginBottom: "16px",
                opacity: 0.3,
              }}
            >
              🗓️
            </div>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "20px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Нет предстоящих мероприятий
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "15px",
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              Здесь будут отображаться предстоящие тренировки, матчи и встречи
            </p>
            <button
              onClick={() => navigate("/events/create")}
              style={{
                padding: "14px 24px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1565c0";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1976d2";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Создать первое мероприятие
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          bottom: "12px",
          left: "12px",
          right: "12px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,255,0.92))",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          padding: "12px",
          border: "1px solid rgba(25, 118, 210, 0.18)",
          borderRadius: "18px",
          boxShadow: "0 10px 26px rgba(15, 30, 64, 0.16)",
        }}
      >
        <div style={{ position: "relative", display: "flex", gap: "8px" }}>
          <button
            onClick={() => navigate("/settings")}
            style={{
              padding: "12px 14px",
              border: "none",
              background: "linear-gradient(180deg, #eef4ff, #e1ebff)",
              borderRadius: "14px",
              fontSize: "13px",
              cursor: "pointer",
              color: "#1f4fa5",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s ease",
              flex: 1,
              fontWeight: "600",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.75)",
            }}
          >
            <span style={{ fontSize: "20px" }}>⚙️</span>
            <span>Настройки</span>
          </button>

          <button
            onClick={() => navigate("/start-search")}
            style={{
              position: "absolute",
              left: "50%",
              top: "0",
              transform: "translate(-50%, -50%)",
              width: "62px",
              height: "62px",
              borderRadius: "50%",
              border: "4px solid rgba(255,255,255,0.95)",
              background: "linear-gradient(180deg, #2f7bff, #1257cf)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 24px rgba(25,118,210,0.42), 0 2px 6px rgba(0,0,0,0.18)",
              fontSize: "26px",
              zIndex: 2,
            }}
            aria-label="Главная"
            title="Главная"
          >
            🏠
          </button>

          <button
            onClick={() => navigate("/calendar")}
            style={{
              padding: "12px 14px",
              border: "none",
              background: "linear-gradient(180deg, #eef4ff, #e1ebff)",
              borderRadius: "14px",
              fontSize: "13px",
              cursor: "pointer",
              color: "#1f4fa5",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s ease",
              flex: 1,
              fontWeight: "600",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.75)",
            }}
          >
            <span style={{ fontSize: "20px" }}>🗓️</span>
            <span>Режим календаря</span>
          </button>
        </div>
      </div>

      <div style={{ height: "110px" }}></div>
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
              border-left: 1px solid #e0e0e0;
              border-right: 1px solid #e0e0e0;
              min-height: 100vh;
            }

            div[style*="position: fixed"] {
              position: static !important;
              border-top: 1px solid #e0e0e0;
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
