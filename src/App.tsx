import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { getEvents } from "./api/events";
import { getUsers } from "./api/users";
import { EventListDto, EventType } from "./types/events";
import { EventPage } from "./EventPage";
import { CreateEventPage } from "./CreateEventPage";
import { DeleteEventPage } from "./DeleteEventPage";
import { CreatePlayerFormPage } from "./CreatePlayerFormPage";
import { ContactInfo } from './ContactInfo';
import { CurrentPlayerHeader } from './CurrentPlayerHeader';

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
}

/* ===================== СТАРТОВАЯ СТРАНИЦА ПОИСКА ===================== */

function StartSearchPage({
  onSelect,
}: {
  onSelect: (u: User) => void;
}) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(s) ||
      u.lastName?.toLowerCase().includes(s) ||
      u.jerseyNumber?.toString().includes(s)
    );
  });

  return (
    <div style={{
      padding: "16px",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      boxSizing: "border-box",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Хедер */}
      <div style={{
        textAlign: "center",
        marginBottom: "32px",
        paddingTop: "24px"
      }}>
        <h1 style={{
          margin: "0 0 8px 0",
          fontSize: "28px",
          fontWeight: "700",
          color: "#1a237e",
          lineHeight: "1.2"
        }}>
          🏒 ХК Северная Столица
        </h1>
        <p style={{
          margin: "0",
          fontSize: "16px",
          color: "#666",
          lineHeight: "1.4"
        }}>
          Найдите себя в списке или добавьте новую анкету
        </p>
      </div>

      {/* Поиск */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h2 style={{
          margin: "0 0 16px 0",
          fontSize: "20px",
          fontWeight: "600",
          color: "#333"
        }}>
          Поиск игрока
        </h2>
        
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <input
            placeholder="Поиск по номеру, имени или фамилии..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 16px 16px 48px",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              fontSize: "16px",
              backgroundColor: "#fafafa",
              boxSizing: "border-box",
              WebkitAppearance: "none"
            }}
          />
          <div style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "20px",
            color: "#666"
          }}>
            🔍
          </div>
        </div>

        {/* Список игроков */}
        <div style={{
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          maxHeight: "300px",
          overflowY: "auto",
          backgroundColor: "#fff",
          marginBottom: "20px"
        }}>
          {loading ? (
            <div style={{
              padding: "32px",
              textAlign: "center",
              color: "#666"
            }}>
              <div style={{
                width: "24px",
                height: "24px",
                border: "2px solid #e0e0e0",
                borderTopColor: "#1976d2",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px auto"
              }} />
              Загрузка списка игроков...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((u) => (
              <div
                key={u.id}
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #f0f0f0",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
                onClick={() => onSelect(u)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "#1976d2",
                  color: "white",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "600",
                  fontSize: "14px",
                  flexShrink: 0
                }}>
                  #{u.jerseyNumber || "?"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: "600",
                    fontSize: "16px",
                    marginBottom: "2px"
                  }}>
                    {u.firstName} {u.lastName}
                  </div>
                  <div style={{
                    fontSize: "14px",
                    color: "#666"
                  }}>
                    ID: {u.id.slice(0, 8)}...
                  </div>
                </div>
                <div style={{
                  fontSize: "20px",
                  color: "#666",
                  opacity: 0.7
                }}>
                  →
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: "32px",
              textAlign: "center",
              color: "#666"
            }}>
              <div style={{
                fontSize: "48px",
                marginBottom: "16px",
                opacity: 0.3
              }}>
                👤
              </div>
              <div style={{ marginBottom: "8px", fontWeight: "500" }}>
                Игрок не найден
              </div>
              <div style={{ fontSize: "14px", color: "#999" }}>
                Попробуйте другой запрос или добавьте себя
              </div>
            </div>
          )}
        </div>

        {/* Кнопка добавления */}
        <div style={{
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          border: "1px solid #e3f2fd",
          textAlign: "center"
        }}>
          <p style={{
            margin: "0 0 16px 0",
            fontSize: "16px",
            color: "#333",
            lineHeight: "1.5"
          }}>
            Не нашли себя в списке?
          </p>
          <button
            onClick={() => navigate("/create-player")}
            style={{
              width: "100%",
              padding: "16px 24px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
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
            <span style={{
              fontSize: 20
             }}>+</span>
            <span>Заполнить анкету игрока</span>
          </button>
          <p style={{
            margin: "12px 0 0 0",
            fontSize: "13px",
            color: "#666",
            lineHeight: "1.4"
          }}>
            После заполнения анкеты вы сможете участвовать в мероприятиях
          </p>
        </div>
      </div>

      <ContactInfo />
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input:focus {
            outline: none;
            border-color: #1976d2 !important;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
          }
          
          /* Для очень маленьких экранов */
          @media (max-width: 360px) {
            h1 {
              font-size: 24px !important;
            }
            
            div[style*="padding: 20px"] {
              padding: 16px !important;
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
            
            div[style*="backgroundColor: white"] {
              max-width: 500px;
              width: 100%;
              margin: 0 auto;
            }
          }
        `}
      </style>
    </div>
  );
}

/* ===================== СПИСОК МЕРОПРИЯТИЙ ===================== */

function EventsListPage({
  currentUser,
}: {
  currentUser: User | null;
}) {
  const [events, setEvents] = useState<EventListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getEvents()
      .then(setEvents)
      .catch((err) => {
        console.error(err);
        setError("Не удалось загрузить мероприятия");
      })
      .finally(() => setLoading(false));
    
    // Обновлять список каждые 30 секунд
    const interval = setInterval(() => {
      getEvents()
        .then(setEvents)
        .catch(console.error);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    if (diffDays === 0) return `Сегодня, ${timeStr}`;
    if (diffDays === 1) return `Завтра, ${timeStr}`;
    if (diffDays === -1) return `Вчера, ${timeStr}`;
    if (diffDays > 1 && diffDays < 7) {
      const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
      return `${days[date.getDay()]}, ${timeStr}`;
    }
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric',
      month: 'short'
    }).replace('.', '') + `, ${timeStr}`;
  };

  // Функция для получения названия типа события
  const getEventTypeName = (type: EventType): string => {
    switch (type) {
      case EventType.Practice:
        return 'Тренировка';
      case EventType.Game:
        return 'Матч';
      case EventType.Meeting:
        return 'Встреча';
      default:
        return 'Событие';
    }
  };

  // Функция для получения цвета типа события
  const getEventTypeColor = (type: EventType): string => {
    switch (type) {
      case EventType.Practice:
        return "#4caf50";
      case EventType.Game:
        return "#2196f3";
      case EventType.Meeting:
        return "#9c27b0";
      default:
        return "#757575";
    }
  };

  // Функция для получения цвета дивизиона
  const getLeagueColor = (leagueName: string): string => {
    // Генерируем консистентный цвет на основе названия лиги
    const colors = [
      "#d32f2f", // Красный
      "#1976d2", // Синий
      "#388e3c", // Зеленый
      "#f57c00", // Оранжевый
      "#7b1fa2", // Фиолетовый
      "#c2185b", // Розовый
      "#00796b", // Бирюзовый
      "#5d4037", // Коричневый
    ];
    
    let hash = 0;
    for (let i = 0; i < leagueName.length; i++) {
      hash = ((hash << 5) - hash) + leagueName.charCodeAt(i);
      hash |= 0;
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div style={{
      padding: "0",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      boxSizing: "border-box",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Хедер с пользователем - используем CurrentPlayerHeader */}
      <div style={{
        backgroundColor: "white",
        padding: "16px",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px"
        }}>
          <h1 style={{
            margin: "0",
            fontSize: "20px",
            fontWeight: "600",
            color: "#1a237e"
          }}>
            🗓️ Мероприятия
          </h1>
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
             <span style={{
              fontSize: 25
              }}>+</span>
            <span>Добавить</span>
          </button>
        </div>

        {/* Внедряем CurrentPlayerHeader */}
        <CurrentPlayerHeader />
      </div>

      {/* Контент */}
      <div style={{ padding: "16px" }}>
        {loading ? (
          <div style={{
            padding: "48px 16px",
            textAlign: "center",
            color: "#666"
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              border: "3px solid #e0e0e0",
              borderTopColor: "#1976d2",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px auto"
            }} />
            <div style={{ fontSize: "16px", fontWeight: "500" }}>
              Загрузка мероприятий...
            </div>
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: "#ffebee",
            color: "#c62828",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "20px",
            fontSize: "15px",
            borderLeft: "4px solid #c62828"
          }}>
            ⚠️ {error}
          </div>
        ) : events?.events && events.events.length > 0 ? (
          <div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}>
              <h2 style={{
                margin: "0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#333"
              }}>
                Предстоящие мероприятия
              </h2>
              <div style={{
                fontSize: "14px",
                color: "#666",
                backgroundColor: "#f0f0f0",
                padding: "4px 10px",
                borderRadius: "12px"
              }}>
                {events.events.length}
              </div>
            </div>

            {events.events.map((e) => (
              <div
                key={e.id}
                style={{
                  backgroundColor: "white",
                  padding: "16px",
                  marginBottom: "12px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
                }}
                onClick={() => navigate(`/events/${e.id}`)}
                onMouseEnter={(elem) => {
                  elem.currentTarget.style.backgroundColor = "#f9f9f9";
                  elem.currentTarget.style.transform = "translateY(-2px)";
                  elem.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(elem) => {
                  elem.currentTarget.style.backgroundColor = "white";
                  elem.currentTarget.style.transform = "translateY(0)";
                  elem.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.04)";
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px"
                }}>
                  <h4 style={{
                    margin: "0",
                    fontSize: "17px",
                    fontWeight: "600",
                    color: "#1a237e",
                    lineHeight: "1.3",
                    flex: 1
                  }}>
                    {e.title ?? "Без названия"}
                  </h4>
                  <div style={{
                    fontSize: "24px",
                    color: "#1976d2",
                    opacity: 0.7,
                    marginLeft: "8px"
                  }}>
                    →
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  flexWrap: "wrap"
                }}>
                  <span style={{
                    fontSize: "14px",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    🕒 {formatDate(e.startTime)}
                  </span>
                  
                  <span style={{
                    fontSize: "12px",
                    color: "#fff",
                    backgroundColor: getEventTypeColor(e.type as EventType),
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontWeight: "500"
                  }}>
                    {getEventTypeName(e.type as EventType)}
                  </span>

                  {/* Плашка дивизиона только для матчей - полное название */}
                  {e.type === EventType.Game && e.leagueName && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: getLeagueColor(e.leagueName),
                      padding: "2px 10px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.3)"
                    }}>
                      <span style={{ fontSize: "12px" }}>🏆</span>
                      <span>{e.leagueName}</span>
                    </div>
                  )}
                </div>
                
                {e.locationName && (
                  <div style={{
                    fontSize: "14px",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "8px"
                  }}>
                    <span>📍</span>
                    <span style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {e.locationName}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: "48px 16px",
            textAlign: "center",
            backgroundColor: "white",
            borderRadius: "16px",
            border: "1px solid #e0e0e0",
            marginTop: "24px"
          }}>
            <div style={{
              fontSize: "64px",
              marginBottom: "16px",
              opacity: 0.3
            }}>
              🗓️
            </div>
            <h3 style={{
              margin: "0 0 8px 0",
              fontSize: "20px",
              fontWeight: "600",
              color: "#333"
            }}>
              Нет мероприятий
            </h3>
            <p style={{
              margin: "0 0 24px 0",
              fontSize: "15px",
              color: "#666",
              lineHeight: "1.5"
            }}>
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
              Создать первое мероприятие
            </button>
          </div>
        )}
      </div>

      {/* Навигация внизу */}
      <div style={{
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        backgroundColor: "white",
        padding: "12px 16px",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        justifyContent: "space-around",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)"
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 16px",
            border: "none",
            background: "transparent",
            borderRadius: "10px",
            fontSize: "14px",
            cursor: "pointer",
            color: "#666",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.2s ease",
            flex: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
            e.currentTarget.style.color = "#1976d2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#666";
          }}
        >
          <span style={{ fontSize: "20px" }}>👤</span>
          <span>Игроки</span>
        </button>
        
        <button
          onClick={() => navigate("/events")}
          style={{
            padding: "12px 16px",
            border: "none",
            background: "#e3f2fd",
            borderRadius: "10px",
            fontSize: "14px",
            cursor: "pointer",
            color: "#1976d2",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.2s ease",
            flex: 1,
            fontWeight: "600"
          }}
        >
          <span style={{ fontSize: "20px" }}>🗓️</span>
          <span>Мероприятия</span>
        </button>
      </div>
      
      {/* Отступ для навигации */}
      <div style={{ height: "80px" }}></div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Для очень маленьких экранов */
          @media (max-width: 360px) {
            div[style*="padding: 16px"] {
              padding: 12px !important;
            }
            
            button[style*="padding: 10px 16px"] {
              padding: 8px 12px !important;
              font-size: 13px !important;
            }
          }
          
          /* Для ПК */
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
          
          /* Безопасные зоны для iPhone */
          @supports (padding: max(0px)) {
            div[style*="position: fixed"] {
              padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
            }
          }
        `}
      </style>
    </div>
  );
}

/* ===================== ОБЁРТКИ ДЛЯ СТРАНИЦ ===================== */

function EventPageWrapper({
  currentUser,
}: {
  currentUser: User | null;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <div>Некорректный ID события</div>;

  return (
    <EventPage
      eventId={id}
      onBack={() => navigate("/events")}
      currentUser={currentUser}
    />
  );
}

function CreateEventWrapper() {
  const navigate = useNavigate();

  return (
    <CreateEventPage
      onBack={() => navigate("/events")}
      onCreated={(id) => navigate(`/events/${id}`)}
    />
  );
}

/* ===================== ГЛАВНЫЙ APP ===================== */

function AppRoutes() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <StartSearchPage
            onSelect={(u) => {
              setCurrentUser(u);
              localStorage.setItem("currentUser", JSON.stringify(u));
              navigate("/events");
            }}
          />
        }
      />

      <Route
        path="/events"
        element={<EventsListPage currentUser={currentUser} />}
      />

      <Route
        path="/events/create"
        element={<CreateEventWrapper />}
      />

      <Route
        path="/events/:id"
        element={<EventPageWrapper currentUser={currentUser} />}
      />
      <Route
        path="/events/:id/delete"
        element={<DeleteEventPage />}
      />
      <Route
        path="/create-player"
        element={<CreatePlayerFormPage />}
      />
    </Routes>
  );
}

/* ===================== РЕАЛЬНЫЙ App ===================== */

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}