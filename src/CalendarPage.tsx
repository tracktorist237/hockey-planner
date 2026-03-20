import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents } from "./api/events";
import { EventListDto, EventType } from "./types/events";
import { CurrentPlayerHeader } from "./CurrentPlayerHeader";
import { formatRuDateLabel } from "./utils/date";

type ViewMode = "month" | "week";

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

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const getUniqueEventColors = (events: any[]): string[] => {
  const colorMap: { [key: string]: boolean } = {};
  events.forEach(event => {
    const color = getEventTypeColor(event.type as EventType);
    colorMap[color] = true;
  });
  return Object.keys(colorMap);
};

export function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setLoading(true);
    getEvents()
      .then(setEvents)
      .catch((err) => {
        console.error(err);
        setError("Не удалось загрузить мероприятия");
      })
      .finally(() => setLoading(false));
  }, []);

  // Автоматическое выделение сегодняшнего дня при загрузке
  useEffect(() => {
    if (!loading && events) {
      setSelectedDate(new Date());
    }
  }, [loading, events]);

  const safeEvents = events?.events || [];

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getEventsForDate = (date: Date) => {
    return safeEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getWeekEvents = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push({
        date: day,
        events: getEventsForDate(day)
      });
    }
    return weekDays;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date()); // Выделяем сегодняшний день при нажатии "Сегодня"
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const weekDays = getWeekEvents();
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div style={{
        padding: "16px",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #e0e0e0",
            borderTopColor: "#1976d2",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px auto"
          }} />
          <div style={{ fontSize: "16px", fontWeight: "500", color: "#666" }}>
            Загрузка календаря...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>⚠️</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#c62828" }}>Ошибка</h3>
          <p style={{ margin: "0 0 24px 0", color: "#666" }}>{error}</p>
          <button
            onClick={() => navigate("/events")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            Назад к списку
          </button>
        </div>
      </div>
    );
  }

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
      <div style={{ padding: "16px", paddingBottom: "100px" }}>
        {/* Заголовок */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px"
          }}>
            <h1 style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "700",
              color: "#1a237e",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span>📅</span>
              <span>Календарь мероприятий</span>
            </h1>
          </div>

          {/* Легенда */}
          <div style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            border: "1px solid #e0e0e0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "16px", height: "16px", backgroundColor: "#4caf50", borderRadius: "4px" }} />
              <span style={{ fontSize: "14px", color: "#333" }}>Тренировка</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "16px", height: "16px", backgroundColor: "#2196f3", borderRadius: "4px" }} />
              <span style={{ fontSize: "14px", color: "#333" }}>Матч</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "16px", height: "16px", backgroundColor: "#9c27b0", borderRadius: "4px" }} />
              <span style={{ fontSize: "14px", color: "#333" }}>Встреча</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "16px", height: "16px", backgroundColor: "#e3f2fd", border: "2px solid #1976d2", borderRadius: "4px" }} />
              <span style={{ fontSize: "14px", color: "#333" }}>Сегодня</span>
            </div>
          </div>
        </div>

        {/* Управление режимами */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: isMobile ? "16px" : 0
          }}>
            <div style={{
              display: "flex",
              gap: "8px",
              width: isMobile ? "100%" : "auto"
            }}>
              <button
                onClick={() => setViewMode("month")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: viewMode === "month" ? "#1976d2" : "#f5f5f5",
                  color: viewMode === "month" ? "white" : "#333",
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: viewMode === "month" ? "600" : "500",
                  cursor: "pointer",
                  flex: isMobile ? 1 : "auto"
                }}
              >
                Месяц
              </button>
              <button
                onClick={() => setViewMode("week")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: viewMode === "week" ? "#1976d2" : "#f5f5f5",
                  color: viewMode === "week" ? "white" : "#333",
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: viewMode === "week" ? "600" : "500",
                  cursor: "pointer",
                  flex: isMobile ? 1 : "auto"
                }}
              >
                Неделя
              </button>
            </div>

            <div style={{
              display: "flex",
              gap: "8px",
              width: isMobile ? "100%" : "auto"
            }}>
              <button
                onClick={viewMode === "month" ? handlePrevMonth : handlePrevWeek}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  cursor: "pointer",
                  flex: isMobile ? 1 : "auto"
                }}
              >
                ←
              </button>
              <button
                onClick={handleToday}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  flex: isMobile ? 2 : "auto"
                }}
              >
                Сегодня
              </button>
              <button
                onClick={viewMode === "month" ? handleNextMonth : handleNextWeek}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  cursor: "pointer",
                  flex: isMobile ? 1 : "auto"
                }}
              >
                →
              </button>
            </div>
          </div>

          <div style={{
            marginTop: "16px",
            textAlign: "center",
            fontSize: isMobile ? "18px" : "22px",
            fontWeight: "600",
            color: "#1a237e"
          }}>
            {viewMode === "month"
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Неделя ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`
            }
          </div>
        </div>

        {/* Календарная сетка */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: isMobile ? "12px" : "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          {viewMode === "month" ? (
            <>
              {/* Дни недели */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: isMobile ? "2px" : "4px",
                marginBottom: "8px"
              }}>
                {dayNames.map(day => (
                  <div key={day} style={{
                    textAlign: "center",
                    fontSize: isMobile ? "12px" : "14px",
                    fontWeight: "600",
                    color: "#666",
                    padding: isMobile ? "4px" : "8px"
                  }}>
                    {isMobile ? day.slice(0, 2) : day}
                  </div>
                ))}
              </div>

              {/* Ячейки дней */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: isMobile ? "2px" : "4px"
              }}>
                {/* Пустые ячейки перед первым днем месяца */}
                {Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }).map((_, i) => (
                  <div key={`empty-${i}`} style={{
                    aspectRatio: "1",
                    backgroundColor: "#fafafa",
                    borderRadius: "8px",
                    opacity: 0.5
                  }} />
                ))}

                {/* Дни месяца */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dayEvents = getEventsForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                  const eventColors = getUniqueEventColors(dayEvents);

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(date)}
                      style={{
                        aspectRatio: "1",
                        padding: isMobile ? "4px" : "8px",
                        backgroundColor: isSelected
                          ? "#bbdefb"
                          : isToday
                            ? "#e3f2fd"
                            : "white",
                        border: `2px solid ${isSelected
                            ? "#1976d2"
                            : isToday
                              ? "#1976d2"
                              : "#e0e0e0"
                          }`,
                        borderRadius: "8px",
                        display: "flex",
                        flexDirection: "column",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        position: "relative"
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: isMobile ? "2px" : "4px"
                      }}>
                        <span style={{
                          fontSize: isMobile ? "14px" : "16px",
                          fontWeight: isToday || isSelected ? "700" : "500",
                          color: isToday || isSelected ? "#1976d2" : "#333"
                        }}>
                          {day}
                        </span>
                      </div>

                      {isMobile ? (
                        // На мобилках - цветные точки
                        <div style={{
                          display: "flex",
                          gap: "2px",
                          flexWrap: "wrap",
                          marginTop: "2px"
                        }}>
                          {eventColors.slice(0, 3).map((color, idx) => (
                            <div
                              key={idx}
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: color,
                                display: "inline-block"
                              }}
                            />
                          ))}
                          {eventColors.length > 3 && (
                            <span style={{ fontSize: "8px", color: "#666" }}>
                              +{eventColors.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        // На ПК - текст с событиями
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px"
                        }}>
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              style={{
                                fontSize: "11px",
                                padding: "2px 4px",
                                backgroundColor: getEventTypeColor(event.type as EventType) + "20",
                                borderLeft: `3px solid ${getEventTypeColor(event.type as EventType)}`,
                                borderRadius: "4px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: "#333",
                                fontWeight: "500"
                              }}
                            >
                              {formatTime(event.startTime)} {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div style={{
                              fontSize: "10px",
                              color: "#666",
                              paddingLeft: "4px"
                            }}>
                              +{dayEvents.length - 3} событий
                            </div>
                          )}
                        </div>
                      )}

                      {!isMobile && dayEvents.length > 0 && (
                        <span style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          fontSize: "10px",
                          backgroundColor: "#1976d2",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          minWidth: "20px",
                          textAlign: "center"
                        }}>
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Недельный просмотр */
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {/* Заголовки дней недели */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: isMobile ? "2px" : "4px",
                marginBottom: "8px"
              }}>
                {weekDays.map((day, index) => {
                  const eventColors = getUniqueEventColors(day.events);
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();

                  return (
                    <div
                      key={index}
                      style={{
                        textAlign: "center",
                        padding: isMobile ? "8px 4px" : "16px 8px",
                        backgroundColor: isSelected
                          ? "#bbdefb"
                          : isToday
                            ? "#e3f2fd"
                            : "white",
                        border: `2px solid ${isSelected
                            ? "#1976d2"
                            : isToday
                              ? "#1976d2"
                              : "#e0e0e0"
                          }`,
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onClick={() => handleDayClick(day.date)}
                    >
                      <div style={{
                        fontSize: isMobile ? "12px" : "14px",
                        fontWeight: isToday || isSelected ? "700" : "500",
                        color: isToday || isSelected ? "#1976d2" : "#333",
                        marginBottom: "4px"
                      }}>
                        {isMobile ? dayNames[index].slice(0, 2) : dayNames[index]}
                      </div>
                      <div style={{
                        fontSize: isMobile ? "16px" : "20px",
                        fontWeight: "600",
                        marginBottom: "4px"
                      }}>
                        {day.date.getDate()}
                      </div>
                      {isMobile ? (
                        // На мобилках - цветные точки
                        <div style={{
                          display: "flex",
                          gap: "2px",
                          justifyContent: "center"
                        }}>
                          {eventColors.slice(0, 3).map((color, idx) => (
                            <div
                              key={idx}
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: color,
                                display: "inline-block"
                              }}
                            />
                          ))}
                          {eventColors.length > 3 && (
                            <span style={{ fontSize: "10px", color: "#666" }}>
                              +{eventColors.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        day.events.length > 0 && (
                          <div style={{
                            fontSize: "12px",
                            backgroundColor: "#1976d2",
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            display: "inline-block"
                          }}>
                            {day.events.length}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Список событий выбранного дня */}
        {selectedDate && (
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}>
              <h3 style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "600",
                color: "#1a237e",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span>📅</span>
                <span>События {formatRuDateLabel(selectedDate.toISOString())}</span>
              </h3>
              {selectedDateEvents.length === 0 && (
                <span style={{
                  fontSize: "14px",
                  color: "#666",
                  backgroundColor: "#f5f5f5",
                  padding: "4px 12px",
                  borderRadius: "20px"
                }}>
                  Нет событий
                </span>
              )}
            </div>

            {selectedDateEvents.length > 0 ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                {selectedDateEvents.map(event => (
                  <div
                    key={event.id}
                    style={{
                      padding: "16px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #e0e0e0",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => handleEventClick(event.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f0f0";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginBottom: "8px"
                    }}>
                      <span style={{
                        fontSize: "14px",
                        color: "#666",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        🕒 {formatTime(event.startTime)}
                      </span>
                      <span style={{
                        fontSize: "13px",
                        color: "#fff",
                        backgroundColor: getEventTypeColor(event.type as EventType),
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontWeight: "500"
                      }}>
                        {getEventTypeName(event.type as EventType)}
                      </span>
                      {event.type === EventType.Game && event.leagueName && (
                        <span style={{
                          fontSize: "12px",
                          color: "#fff",
                          backgroundColor: getEventTypeColor(event.type as EventType),
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontWeight: "500",
                          opacity: 0.8
                        }}>
                          🏆 {event.leagueName}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#1a237e",
                      marginBottom: "8px"
                    }}>
                      {event.title}
                    </div>
                    {event.locationName && (
                      <div style={{
                        fontSize: "14px",
                        color: "#666",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        📍 {event.locationName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: "32px",
                textAlign: "center",
                color: "#666",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>📅</div>
                <p style={{ margin: 0, fontSize: "16px" }}>
                  В этот день нет запланированных мероприятий
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (min-width: 768px) {
            div[style*="minHeight: 100vh"] {
              max-width: 800px;
              margin: 0 auto;
              border-left: 1px solid #e0e0e0;
              border-right: 1px solid #e0e0e0;
            }
          }
          
          @supports (padding: max(0px)) {
            div[style*="position: sticky"] {
              padding-top: max(16px, env(safe-area-inset-top, 16px));
            }
          }
        `}
      </style>
    </div>
  );
}
