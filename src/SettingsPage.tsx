import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CurrentPlayerHeader } from "./CurrentPlayerHeader";
import { APP_VERSION } from "./config/version";

export function SettingsPage() {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Функция для ручного обновления
  const manualUpdate = async (): Promise<boolean> => {
    setIsUpdating(true);
    
    try {
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        return false;
      }

      await registration.update();
      
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            resolve();
          }, { once: true });
        });
        
        window.location.reload();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Ошибка при обновлении:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdate = async () => {
    const hasUpdate = await manualUpdate();
    if (!hasUpdate) {
      setMessage('У вас последняя версия');
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Вы уверены? Это очистит весь кэш и перезагрузит приложение.')) {
      setIsClearing(true);
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(key => caches.delete(key)));
          
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
          }
          
          setMessage('✅ Кэш очищен. Перезагрузка...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        console.error('Ошибка очистки кэша:', error);
        setMessage('❌ Ошибка при очистке кэша');
        setTimeout(() => setMessage(null), 2000);
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div style={{
      padding: "0",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: "border-box"
    }}>
      {/* Хедер */}
      <div style={{
        backgroundColor: "white",
        padding: "16px",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "12px"
        }}>
          <button
            onClick={() => navigate("/events")}
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
          <div style={{ flex: 1 }}>
            <CurrentPlayerHeader />
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div style={{ padding: "16px" }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h1 style={{
            margin: "0 0 8px 0",
            fontSize: "22px",
            fontWeight: "700",
            color: "#1a237e"
          }}>
            ⚙️ Настройки приложения
          </h1>
          <p style={{
            margin: "0",
            fontSize: "15px",
            color: "#666",
            lineHeight: "1.5"
          }}>
            Управление обновлениями и кэшем
          </p>
        </div>

        {/* Карточка с версией */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          textAlign: "center"
        }}>
          <div style={{
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px"
          }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
              Текущая версия
            </div>
            <div style={{ fontSize: "36px", fontWeight: "700", color: "#1a237e", marginBottom: "8px" }}>
              v{APP_VERSION}
            </div>
            <div style={{
              fontSize: "14px",
              color: "#f57c00",
              backgroundColor: "#fff3e0",
              padding: "6px 16px",
              borderRadius: "20px",
              display: "inline-block"
            }}>
              🚧 Ранняя стадия разработки
            </div>
          </div>

          {/* Кнопки действий */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              onClick={handleUpdate}
              disabled={isUpdating || isClearing}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: isUpdating ? "#78909c" : "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isUpdating ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                opacity: isUpdating || isClearing ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isUpdating && !isClearing) {
                  e.currentTarget.style.backgroundColor = "#1565c0";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isUpdating && !isClearing) {
                  e.currentTarget.style.backgroundColor = "#1976d2";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span style={{ fontSize: "20px" }}>
                {isUpdating ? '⏳' : '🔄'}
              </span>
              <span>
                {isUpdating ? 'Проверка обновлений...' : 'Проверить обновления'}
              </span>
            </button>

            <button
              onClick={handleClearCache}
              disabled={isClearing || isUpdating}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: isClearing ? "#78909c" : "#ffebee",
                color: isClearing ? "white" : "#d32f2f",
                border: "1px solid #ffcdd2",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isClearing ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                opacity: isClearing || isUpdating ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isClearing && !isUpdating) {
                  e.currentTarget.style.backgroundColor = "#ffcdd2";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isClearing && !isUpdating) {
                  e.currentTarget.style.backgroundColor = "#ffebee";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <span style={{ fontSize: "20px" }}>
                {isClearing ? '⏳' : '🧹'}
              </span>
              <span>
                {isClearing ? 'Очистка кэша...' : 'Очистить кэш'}
              </span>
            </button>
          </div>

          {/* Всплывающее сообщение */}
          {message && (
            <div style={{
              marginTop: "20px",
              padding: "12px",
              backgroundColor: message.includes('✅') ? "#e8f5e9" : 
                               message.includes('❌') ? "#ffebee" : "#e3f2fd",
              color: message.includes('✅') ? "#2e7d32" : 
                     message.includes('❌') ? "#c62828" : "#1976d2",
              borderRadius: "8px",
              fontSize: "14px",
              textAlign: "center",
              animation: "fadeIn 0.3s ease"
            }}>
              {message}
            </div>
          )}
        </div>

        {/* Информационная карточка */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "600",
            color: "#1a237e"
          }}>
            ℹ️ Информация
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{
              padding: "12px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#666",
              lineHeight: "1.5"
            }}>
              <strong>Что такое очистка кэша?</strong><br/>
              • Удаляет все сохраненные файлы приложения<br/>
              • Сбрасывает service worker<br/>
              • Перезагружает приложение<br/>
              • Ваши данные (игрок, мероприятия) сохраняются
            </div>

            <div style={{
              padding: "12px",
              backgroundColor: "#e3f2fd",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#1976d2"
            }}>
              <strong>💡 Совет:</strong> Используйте проверку обновлений, если 
              интерфейс не соответствует последней версии.
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @media (min-width: 768px) {
            div[style*="minHeight: 100vh"] {
              max-width: 600px;
              margin: 0 auto;
              border-left: 1px solid #e0e0e0;
              border-right: 1px solid #e0e0e0;
            }
          }
        `}
      </style>
    </div>
  );
}