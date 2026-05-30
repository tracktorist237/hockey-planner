import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteEvent } from "./api/events"; // 👈 импортируем
import { CheckboxControl } from "src/components/CheckboxControl";
import { useAuth } from "src/hooks/useAuth";

export function DeleteEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!id) {
    return (
      <div style={{
        padding: "16px",
        minHeight: "100vh",
        background: "var(--hp-bg-gradient)",
        color: "var(--hp-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{
            fontSize: "64px",
            marginBottom: "16px",
            opacity: 0.3
          }}>
            ⚠️
          </div>
          <h2 style={{ margin: "0 0 8px 0", color: "var(--hp-danger)" }}>
            Ошибка
          </h2>
          <p style={{ margin: "0 0 24px 0", color: "var(--hp-muted)" }}>
            Некорректный ID события
          </p>
          <button
            onClick={() => navigate("/events")}
            style={{
              padding: "14px 24px",
              backgroundColor: "var(--hp-primary)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--hp-primary-hover)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--hp-primary)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!currentUser?.id) {
      setError("Необходимо войти в систему для удаления события");
      return;
    }

    if (!confirmed) {
      setError("Подтвердите удаление, отметив чекбокс");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await deleteEvent(id, currentUser.id);
      setMessage(data.message);

      // через 2 секунды — возврат к списку
      setTimeout(() => {
        navigate("/events");
      }, 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };


  return (
    <div style={{ 
      padding: "16px",
      minHeight: "100vh",
      background: "var(--hp-bg-gradient)",
      color: "var(--hp-text)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: "border-box"
    }}>
      {/* Хедер */}
      <div style={{
        backgroundColor: "var(--hp-surface)",
        padding: "16px",
        borderRadius: "16px",
        marginBottom: "20px",
        boxShadow: "var(--hp-shadow-sm)"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <button
            onClick={handleCancel}
            style={{
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--hp-border)",
              background: "var(--hp-surface)",
              fontSize: "20px",
              cursor: "pointer",
              borderRadius: "10px",
              marginRight: "12px",
              flexShrink: 0,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--hp-surface-hover)";
              e.currentTarget.style.borderColor = "var(--hp-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--hp-surface)";
              e.currentTarget.style.borderColor = "var(--hp-border)";
            }}
          >
            ←
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: "20px",
            fontWeight: "600",
            color: "var(--hp-heading)"
          }}>
            Удаление мероприятия
          </h1>
        </div>

        {currentUser && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            backgroundColor: "var(--hp-surface-soft)",
            borderRadius: "10px",
            border: "1px solid var(--hp-border)"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              backgroundColor: "var(--hp-primary)",
              color: "white",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "600",
              fontSize: "16px"
            }}>
              #{currentUser.jerseyNumber || "?"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: "16px" }}>
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div style={{ fontSize: "13px", color: "var(--hp-muted)" }}>
                Вы вошли как организатор
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Основной контент */}
      <div style={{
        backgroundColor: "var(--hp-surface)",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "var(--hp-shadow-sm)",
        textAlign: "center"
      }}>
        <div style={{
          fontSize: "64px",
          marginBottom: "20px",
          color: "var(--hp-danger)",
          opacity: 0.9
        }}>
          ⚠️
        </div>

        <h2 style={{
          margin: "0 0 12px 0",
          fontSize: "22px",
          fontWeight: "700",
          color: "var(--hp-danger)"
        }}>
          Внимание! Опасное действие
        </h2>

        <p style={{
          margin: "0 0 16px 0",
          fontSize: "16px",
          color: "var(--hp-muted)",
          lineHeight: "1.6"
        }}>
          Вы собираетесь <strong style={{ color: "var(--hp-danger)" }}>навсегда удалить</strong> это мероприятие.
        </p>

        <div style={{
          backgroundColor: "var(--hp-danger-soft)",
          border: "1px solid var(--hp-danger-border)",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          textAlign: "left"
        }}>
          <p style={{ 
            margin: "0 0 8px 0", 
            fontSize: "15px",
            color: "var(--hp-danger)",
            fontWeight: "600"
          }}>
            ⚠️ Это действие нельзя отменить
          </p>
          <ul style={{ 
            margin: "0", 
            paddingLeft: "20px",
            fontSize: "14px",
            color: "var(--hp-muted)",
            lineHeight: "1.6"
          }}>
            <li>Все данные о мероприятии будут удалены</li>
            <li>Состав и явка игроков будут утеряны</li>
            <li>Уведомления игрокам не отправляются</li>
          </ul>
        </div>

        {!message ? (
          <>
            {/* Чекбокс подтверждения */}
            <div style={{
              marginBottom: "24px",
              padding: "16px",
              backgroundColor: "var(--hp-surface-soft)",
              borderRadius: "12px",
              border: "1px solid var(--hp-border)"
            }}>
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                userSelect: "none"
              }}>
                <div>
                  <CheckboxControl
                    checked={confirmed}
                    onChange={(checked) => {
                      setConfirmed(checked);
                      setError(null);
                    }}
                    label=""
                  />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ 
                    fontWeight: "600", 
                    fontSize: "15px",
                    color: "var(--hp-text)",
                    marginBottom: "4px"
                  }}>
                    Я понимаю последствия и хочу удалить мероприятие
                  </div>
                  <div style={{ 
                    fontSize: "13px", 
                    color: "var(--hp-muted)",
                    lineHeight: "1.4"
                  }}>
                    Отметив этот чекбокс, вы подтверждаете, что осознаете необратимость этого действия
                  </div>
                </div>
              </div>
            </div>

            <div style={{ 
              display: "flex", 
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap"
            }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: "14px 28px",
                  backgroundColor: "var(--hp-surface-soft)",
                  color: "var(--hp-muted)",
                  border: "1px solid var(--hp-border)",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  minWidth: "140px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--hp-surface-muted)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--hp-surface-soft)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Отмена
              </button>

              <button
                disabled={loading || !confirmed}
                onClick={handleDelete}
                style={{
                  padding: "14px 28px",
                  backgroundColor: confirmed ? "var(--hp-danger)" : "var(--hp-danger-border)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: confirmed && !loading ? "pointer" : "not-allowed",
                  opacity: confirmed ? 1 : 0.6,
                  transition: "all 0.2s ease",
                  minWidth: "140px"
                }}
                onMouseEnter={(e) => {
                  if (confirmed && !loading) {
                    e.currentTarget.style.backgroundColor = "var(--hp-danger)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (confirmed && !loading) {
                    e.currentTarget.style.backgroundColor = "var(--hp-danger)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ 
                      width: "16px", 
                      height: "16px", 
                      border: "2px solid rgba(255,255,255,0.3)", 
                      borderTopColor: "white", 
                      borderRadius: "50%", 
                      animation: "spin 1s linear infinite" 
                    }} />
                    Удаление...
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <span>🗑️</span>
                    <span>Удалить</span>
                  </span>
                )}
              </button>
            </div>

            {error && (
              <div style={{ 
                marginTop: "16px", 
                padding: "12px",
                backgroundColor: "var(--hp-danger-soft)",
                color: "var(--hp-danger)",
                borderRadius: "10px",
                fontSize: "14px"
              }}>
                ⚠️ {error}
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: "24px",
            backgroundColor: "var(--hp-success-soft)",
            borderRadius: "12px",
            border: "1px solid var(--hp-success-border)",
            marginBottom: "20px"
          }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "16px",
              color: "var(--hp-success)"
            }}>
              ✓
            </div>
            <h3 style={{
              margin: "0 0 8px 0",
              fontSize: "20px",
              fontWeight: "600",
              color: "var(--hp-success)"
            }}>
              Успешно удалено!
            </h3>
            <p style={{
              margin: "0 0 20px 0",
              fontSize: "16px",
              color: "var(--hp-success)",
              opacity: 0.9
            }}>
              {message}
            </p>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "8px",
              color: "var(--hp-muted)",
              fontSize: "14px"
            }}>
              <span style={{ 
                width: "16px", 
                height: "16px", 
                border: "2px solid var(--hp-border)", 
                borderTopColor: "var(--hp-primary)", 
                borderRadius: "50%", 
                animation: "spin 1s linear infinite" 
              }} />
              Перенаправление через 2 секунды...
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        textAlign: "center", 
        fontSize: "13px", 
        color: "var(--hp-muted)",
        padding: "12px"
      }}>
        <p style={{ margin: "0 0 4px 0" }}>
          Удаление выполняется от имени текущего пользователя
        </p>
        <p style={{ margin: 0 }}>
          ID события: <code style={{ backgroundColor: "var(--hp-surface-soft)", padding: "2px 6px", borderRadius: "4px" }}>{id}</code>
        </p>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Для очень маленьких экранов */
          @media (max-width: 360px) {
            div[style*="padding: 24px"] {
              padding: 20px !important;
            }
            
            button[style*="padding: 14px 28px"] {
              padding: 12px 20px !important;
              font-size: 15px !important;
            }
          }
          
          /* Для ПК */
          @media (min-width: 768px) {
            div[style*="minHeight: 100vh"] {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
            }
            
            div[style*="margin: 0 auto"] {
              max-width: 500px;
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}
