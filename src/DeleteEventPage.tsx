import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteEvent } from "./api/events"; // 👈 импортируем

export function DeleteEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const currentUser = (() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  })();

  if (!id) {
    return (
      <div style={{
        padding: "16px",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
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
          <h2 style={{ margin: "0 0 8px 0", color: "#c62828" }}>
            Ошибка
          </h2>
          <p style={{ margin: "0 0 24px 0", color: "#666" }}>
            Некорректный ID события
          </p>
          <button
            onClick={() => navigate("/events")}
            style={{
              padding: "14px 24px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
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
      const data = await deleteEvent(id);
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
      backgroundColor: "#f5f5f5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: "border-box"
    }}>
      {/* Хедер */}
      <div style={{
        backgroundColor: "white",
        padding: "16px",
        borderRadius: "16px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
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
              border: "1px solid #e0e0e0",
              background: "white",
              fontSize: "20px",
              cursor: "pointer",
              borderRadius: "10px",
              marginRight: "12px",
              flexShrink: 0,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
              e.currentTarget.style.borderColor = "#1976d2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            ←
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: "20px",
            fontWeight: "600",
            color: "#1a237e"
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
            backgroundColor: "#f8f9fa",
            borderRadius: "10px",
            border: "1px solid #e0e0e0"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#1976d2",
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
              <div style={{ fontSize: "13px", color: "#666" }}>
                Вы вошли как организатор
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Основной контент */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        textAlign: "center"
      }}>
        <div style={{
          fontSize: "64px",
          marginBottom: "20px",
          color: "#d32f2f",
          opacity: 0.9
        }}>
          ⚠️
        </div>

        <h2 style={{
          margin: "0 0 12px 0",
          fontSize: "22px",
          fontWeight: "700",
          color: "#c62828"
        }}>
          Внимание! Опасное действие
        </h2>

        <p style={{
          margin: "0 0 16px 0",
          fontSize: "16px",
          color: "#666",
          lineHeight: "1.6"
        }}>
          Вы собираетесь <strong style={{ color: "#c62828" }}>навсегда удалить</strong> это мероприятие.
        </p>

        <div style={{
          backgroundColor: "#ffebee",
          border: "1px solid #ffcdd2",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          textAlign: "left"
        }}>
          <p style={{ 
            margin: "0 0 8px 0", 
            fontSize: "15px",
            color: "#c62828",
            fontWeight: "600"
          }}>
            ⚠️ Это действие нельзя отменить
          </p>
          <ul style={{ 
            margin: "0", 
            paddingLeft: "20px",
            fontSize: "14px",
            color: "#666",
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
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              border: "1px solid #e0e0e0"
            }}>
              <label style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                cursor: "pointer",
                userSelect: "none"
              }}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    setError(null);
                  }}
                  style={{
                    width: "20px",
                    height: "20px",
                    marginTop: "2px",
                    flexShrink: 0,
                    cursor: "pointer"
                  }}
                />
                <div style={{ textAlign: "left" }}>
                  <div style={{ 
                    fontWeight: "600", 
                    fontSize: "15px",
                    color: "#333",
                    marginBottom: "4px"
                  }}>
                    Я понимаю последствия и хочу удалить мероприятие
                  </div>
                  <div style={{ 
                    fontSize: "13px", 
                    color: "#666",
                    lineHeight: "1.4"
                  }}>
                    Отметив этот чекбокс, вы подтверждаете, что осознаете необратимость этого действия
                  </div>
                </div>
              </label>
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
                  backgroundColor: "#f5f5f5",
                  color: "#666",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  minWidth: "140px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e0e0";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f5f5";
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
                  backgroundColor: confirmed ? "#d32f2f" : "#ffcdd2",
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
                    e.currentTarget.style.backgroundColor = "#b71c1c";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (confirmed && !loading) {
                    e.currentTarget.style.backgroundColor = "#d32f2f";
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
                backgroundColor: "#ffebee",
                color: "#c62828",
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
            backgroundColor: "#e8f5e9",
            borderRadius: "12px",
            border: "1px solid #c8e6c9",
            marginBottom: "20px"
          }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "16px",
              color: "#2e7d32"
            }}>
              ✓
            </div>
            <h3 style={{
              margin: "0 0 8px 0",
              fontSize: "20px",
              fontWeight: "600",
              color: "#2e7d32"
            }}>
              Успешно удалено!
            </h3>
            <p style={{
              margin: "0 0 20px 0",
              fontSize: "16px",
              color: "#2e7d32",
              opacity: 0.9
            }}>
              {message}
            </p>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "8px",
              color: "#666",
              fontSize: "14px"
            }}>
              <span style={{ 
                width: "16px", 
                height: "16px", 
                border: "2px solid #e0e0e0", 
                borderTopColor: "#1976d2", 
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
        color: "#999",
        padding: "12px"
      }}>
        <p style={{ margin: "0 0 4px 0" }}>
          Удаление выполняется от имени текущего пользователя
        </p>
        <p style={{ margin: 0 }}>
          ID события: <code style={{ backgroundColor: "#f5f5f5", padding: "2px 6px", borderRadius: "4px" }}>{id}</code>
        </p>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input[type="checkbox"]:focus {
            outline: 2px solid #1976d2;
            outline-offset: 2px;
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