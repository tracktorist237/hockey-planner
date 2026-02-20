import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEvent } from "./api/events";
import { updateEvent } from "./api/events"; // 👈 импортируем
import { EventDto, EventType } from "./types/events";
import { AddressSearchInput } from "./AddressSearchInput";
import { CurrentPlayerHeader } from "./CurrentPlayerHeader";

export function UpdateEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<EventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния формы (как в CreateEventPage)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [iceRinkNumber, setIceRinkNumber] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [homeTeamName, setHomeTeamName] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");
  const [useAddressSearch, setUseAddressSearch] = useState(true);

  const [type, setType] = useState<EventType>(EventType.Practice);

  const [cancelHover, setCancelHover] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);

  // Загружаем данные события
  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    getEvent(id)
      .then((eventData) => {
        setEvent(eventData);
        
        // Заполняем форму данными события
        setType(eventData.type);
        setTitle(eventData.title || "");
        setDescription(eventData.description || "");
        setStartTime(new Date(eventData.startTime).toISOString().slice(0, 16));
        setLocationName(eventData.locationName || "");
        setLocationAddress(eventData.locationAddress || "");
        setIceRinkNumber(eventData.iceRinkNumber || "");
        setLeagueName(eventData.leagueName || "");
        setHomeTeamName(eventData.homeTeamName || "");
        setAwayTeamName(eventData.awayTeamName || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Логика смены типа события (как в CreateEventPage)
  const handleTypeChange = (newType: EventType) => {
    setType(newType);
    if (newType !== EventType.Meeting) {
      setTitle("");
    }
    if (newType !== EventType.Game) {
      setHomeTeamName("");
      setAwayTeamName("");
      setLeagueName("");
    }
  };

  const handleSubmit = async () => {
    if (!id) {
      setError("ID события не указан");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Формируем финальный заголовок (как в CreateEventPage)
    let finalTitle = title;

    if (type === EventType.Practice) {
      finalTitle = "Тренировка";
    } else if (type === EventType.Game) {
      if (homeTeamName && awayTeamName) {
        finalTitle = `${homeTeamName} - ${awayTeamName}`;
      } else {
        setError("Для матча необходимо указать названия команд");
        setSubmitting(false);
        return;
      }
    } else if (type === EventType.Meeting) {
      if (!title.trim()) {
        setError("Для встречи необходимо указать название");
        setSubmitting(false);
        return;
      }
    }

    if (!startTime) {
      setError("Необходимо указать дату и время начала");
      setSubmitting(false);
      return;
    }

    const dto = {
      title: finalTitle,
      description: description || null,
      type,
      startTime: new Date(startTime).toISOString(),
      locationName: locationName || null,
      locationAddress: locationAddress || null,
      iceRinkNumber: iceRinkNumber || null,
      leagueName: leagueName || null,
      ...(type === EventType.Game
        ? {
          homeTeamName: homeTeamName || null,
          awayTeamName: awayTeamName || null,
        }
        : {}),
    };

    try {
      await updateEvent(id, dto); // 👈 используем функцию из API

      // Возвращаемся на страницу события
      navigate(`/events/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isGame = type === EventType.Game;
  const isMeeting = type === EventType.Meeting;
  const isPractice = type === EventType.Practice;
  
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
            Загрузка данных события...
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
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
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>🗓️</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>Событие не найдено</h3>
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
      {/* Хедер - как в CreateEventPage */}
      <div style={{
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        zIndex: "100",
        backgroundColor: "white",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        padding: "16px",
        height: "76px",
        boxSizing: "border-box"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          maxWidth: "100%",
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box"
        }}>
          <button
            onClick={() => navigate(`/events/${id}`)}
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
            ⬅
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: "20px",
            fontWeight: "600",
            color: "#1a237e",
            flex: 1
          }}>
            Редактирование события
          </h1>
        </div>
      </div>

      {/* Основной контент - как в CreateEventPage */}
      <div style={{
        padding: "16px",
        paddingTop: "92px",
        paddingBottom: "120px",
        maxWidth: "100%",
        margin: "0 auto",
        boxSizing: "border-box"
      }}>
        <div style={{
          maxWidth: "100%",
          margin: "0 auto",
          boxSizing: "border-box"
        }}>
          
          {error && (
            <div style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              padding: "14px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "15px",
              borderLeft: "4px solid #c62828",
              width: "100%",
              boxSizing: "border-box"
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Карточка формы */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            width: "100%",
            boxSizing: "border-box"
          }}>
            
            {/* Тип события */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ 
                display: "block", 
                marginBottom: "12px", 
                fontWeight: "600",
                fontSize: "16px",
                color: "#333"
              }}>
                Тип события *
              </div>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <button
                  type="button"
                  onClick={() => handleTypeChange(EventType.Practice)}
                  style={{
                    padding: "14px 8px",
                    border: `2px solid ${isPractice ? "#1976d2" : "#e0e0e0"}`,
                    background: isPractice ? "#e3f2fd" : "#fff",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "70px",
                    width: "100%",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!isPractice) {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPractice) {
                      e.currentTarget.style.backgroundColor = "#fff";
                    }
                  }}
                >
                  <span style={{ fontSize: "20px" }}>🏒</span>
                  <span>Тренировка</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange(EventType.Game)}
                  style={{
                    padding: "14px 8px",
                    border: `2px solid ${isGame ? "#1976d2" : "#e0e0e0"}`,
                    background: isGame ? "#e3f2fd" : "#fff",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "70px",
                    width: "100%",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!isGame) {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isGame) {
                      e.currentTarget.style.backgroundColor = "#fff";
                    }
                  }}
                >
                  <span style={{ fontSize: "20px" }}>⚽</span>
                  <span>Матч</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange(EventType.Meeting)}
                  style={{
                    padding: "14px 8px",
                    border: `2px solid ${isMeeting ? "#1976d2" : "#e0e0e0"}`,
                    background: isMeeting ? "#e3f2fd" : "#fff",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "70px",
                    width: "100%",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!isMeeting) {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMeeting) {
                      e.currentTarget.style.backgroundColor = "#fff";
                    }
                  }}
                >
                  <span style={{ fontSize: "20px" }}>👥</span>
                  <span>Встреча</span>
                </button>
              </div>
            </div>

            {/* Название встречи */}
            {isMeeting && (
              <div style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "600",
                  fontSize: "16px",
                  color: "#333"
                }}>
                  Название встречи *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Собрание команды"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "16px",
                    backgroundColor: "#fafafa",
                    boxSizing: "border-box",
                    maxWidth: "100%"
                  }}
                />
              </div>
            )}

            {/* Информация о матче */}
            {isGame && (
              <div style={{
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
                border: "1px solid #e3f2fd",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <h3 style={{ 
                  marginTop: 0, 
                  marginBottom: "16px",
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1a237e"
                }}>
                  🏆 Информация о матче
                </h3>

                <div style={{ marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "500",
                    fontSize: "15px"
                  }}>
                    Лига (дивизион)
                  </label>
                  <input
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="Например: Д4"
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "10px",
                      fontSize: "16px",
                      backgroundColor: "white",
                      boxSizing: "border-box",
                      maxWidth: "100%"
                    }}
                  />
                </div>

                <div style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  gap: "16px", 
                  marginBottom: "16px",
                  width: "100%",
                  boxSizing: "border-box"
                }}>
                  <div style={{ width: "100%", boxSizing: "border-box" }}>
                    <label style={{ 
                      display: "block", 
                      marginBottom: "8px", 
                      fontWeight: "500",
                      fontSize: "15px"
                    }}>
                      Домашняя команда *
                    </label>
                    <input
                      value={homeTeamName}
                      onChange={(e) => setHomeTeamName(e.target.value)}
                      placeholder="Например: Медведи"
                      style={{
                        width: "100%",
                        padding: "14px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "10px",
                        fontSize: "16px",
                        backgroundColor: "white",
                        boxSizing: "border-box",
                        maxWidth: "100%"
                      }}
                    />
                  </div>

                  <div style={{ width: "100%", boxSizing: "border-box" }}>
                    <label style={{ 
                      display: "block", 
                      marginBottom: "8px", 
                      fontWeight: "500",
                      fontSize: "15px"
                    }}>
                      Гостевая команда *
                    </label>
                    <input
                      value={awayTeamName}
                      onChange={(e) => setAwayTeamName(e.target.value)}
                      placeholder="Например: Волки"
                      style={{
                        width: "100%",
                        padding: "14px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "10px",
                        fontSize: "16px",
                        backgroundColor: "white",
                        boxSizing: "border-box",
                        maxWidth: "100%"
                      }}
                    />
                  </div>
                </div>

                {homeTeamName && awayTeamName && (
                  <div style={{
                    padding: "12px",
                    backgroundColor: "#e8f5e9",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: "#2e7d32",
                    textAlign: "center",
                    border: "1px solid #c8e6c9",
                    width: "100%",
                    boxSizing: "border-box"
                  }}>
                    <strong>Название матча:</strong><br />
                    <span style={{ fontSize: "15px", fontWeight: "600" }}>
                      {homeTeamName} — {awayTeamName}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Описание */}
            <div style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "600",
                fontSize: "16px",
                color: "#333"
              }}>
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дополнительная информация о событии..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "16px",
                  resize: "vertical",
                  backgroundColor: "#fafafa",
                  minHeight: "120px",
                  lineHeight: "1.5",
                  boxSizing: "border-box",
                  maxWidth: "100%"
                }}
              />
            </div>

            {/* Дата и время */}
            <div style={{ marginBottom: "20px", width: "100%", boxSizing: "border-box" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "600",
                fontSize: "16px",
                color: "#333"
              }}>
                Дата и время начала *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "16px",
                  backgroundColor: "#fafafa",
                  boxSizing: "border-box",
                  maxWidth: "100%"
                }}
              />
            </div>

            {/* Место проведения */}
            <div style={{
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
              border: "1px solid #e0e0e0",
              width: "100%",
              boxSizing: "border-box"
            }}>
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: "16px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#1a237e"
              }}>
                📍 Место проведения
              </h3>

              <div style={{ marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "500",
                  fontSize: "15px"
                }}>
                  Название места
                </label>
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Например: Ледовый дворец 'Арена'"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "16px",
                    backgroundColor: "white",
                    boxSizing: "border-box",
                    maxWidth: "100%"
                  }}
                />
              </div>

              {/* Адрес с тумблером */}
              <div style={{ marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                  gap: "10px"
                }}>
                  <label style={{ 
                    fontWeight: "500",
                    fontSize: "15px",
                    flexShrink: 0
                  }}>
                    Адрес *
                  </label>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <span style={{ 
                      fontSize: "14px", 
                      color: !useAddressSearch ? "#333" : "#999"
                    }}>
                      ✏️ Ручной
                    </span>
                    <div
                      onClick={() => setUseAddressSearch(!useAddressSearch)}
                      style={{
                        position: "relative",
                        width: "52px",
                        height: "28px",
                        backgroundColor: useAddressSearch ? "#4caf50" : "#ddd",
                        borderRadius: "28px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "0.9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                    >
                      <div style={{
                        position: "absolute",
                        top: "4px",
                        left: useAddressSearch ? "28px" : "4px",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "white",
                        borderRadius: "50%",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }} />
                    </div>
                    <span style={{ 
                      fontSize: "14px", 
                      color: useAddressSearch ? "#333" : "#999"
                    }}>
                      🔍 Авто
                    </span>
                  </div>
                </div>

                {useAddressSearch ? (
                  <div style={{ width: "100%", boxSizing: "border-box" }}>
                    <AddressSearchInput
                      value={locationAddress}
                      onChange={setLocationAddress}
                      onLocationNameChange={setLocationName}
                      locationName={locationName}
                      placeholder="Начните вводить адрес..."
                    />
                  </div>
                ) : (
                  <textarea
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Страна, город, улица, дом..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "10px",
                      fontSize: "16px",
                      resize: "vertical",
                      backgroundColor: "white",
                      minHeight: "100px",
                      boxSizing: "border-box",
                      maxWidth: "100%"
                    }}
                  />
                )}
                
                <div style={{ 
                  marginTop: "10px", 
                  fontSize: "13px", 
                  color: "#666",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px"
                }}>
                  <span style={{ flexShrink: 0 }}>{useAddressSearch ? "💡" : "📝"}</span>
                  <span>
                    {useAddressSearch 
                      ? "Введите улицу и номер дома для поиска. Можно искать по городу или названию места." 
                      : "Укажите адрес полностью для навигации участников."}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: "0", width: "100%", boxSizing: "border-box" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "500",
                  fontSize: "15px"
                }}>
                  Номер льда/корта
                </label>
                <input
                  value={iceRinkNumber}
                  onChange={(e) => setIceRinkNumber(e.target.value)}
                  placeholder="Например: Лед №1 или Корпус А"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "16px",
                    backgroundColor: "white",
                    boxSizing: "border-box",
                    maxWidth: "100%"
                  }}
                />
              </div>
            </div>

            {/* Информация о заголовке для тренировки */}
            {isPractice && (
              <div style={{
                padding: "12px",
                backgroundColor: "#fff3e0",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "14px",
                color: "#ef6c00",
                textAlign: "center",
                border: "1px solid #ffe0b2",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <strong>Название события:</strong> "Тренировка"
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Футер - как в CreateEventPage */}
      <div style={{ 
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        backgroundColor: "white",
        padding: "16px",
        borderTop: "1px solid #e0e0e0",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
        display: "flex",
        gap: "12px",
        zIndex: "100",
        boxSizing: "border-box",
        height: "88px"
      }}>
        <div style={{
          display: "flex",
          gap: "12px",
          width: "100%",
          maxWidth: "100%",
          margin: "0 auto",
          padding: "0 16px",
          boxSizing: "border-box"
        }}>
          <button
            onClick={() => navigate(`/events/${id}`)}
            onMouseEnter={() => setCancelHover(true)}
            onMouseLeave={() => setCancelHover(false)}
            style={{
              padding: "16px 20px",
              border: "1px solid #e0e0e0",
              background: cancelHover ? "#f5f5f5" : "white",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
              flex: 1,
              color: "#333",
              minWidth: "120px",
              boxSizing: "border-box",
              transition: "all 0.2s ease",
              transform: cancelHover ? "translateY(-1px)" : "none"
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            onMouseEnter={() => !submitting && setSubmitHover(true)}
            onMouseLeave={() => setSubmitHover(false)}
            style={{
              padding: "16px 20px",
              border: "none",
              background: submitting ? "#78909c" : (submitHover ? "#1565c0" : "#1976d2"),
              color: "white",
              borderRadius: "10px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: "600",
              flex: 2,
              minWidth: "180px",
              boxSizing: "border-box",
              transition: "all 0.2s ease",
              transform: (submitHover && !submitting) ? "translateY(-1px)" : "none"
            }}
          >
            {submitting ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span style={{ 
                  width: "16px", 
                  height: "16px", 
                  border: "2px solid rgba(255,255,255,0.3)", 
                  borderTopColor: "white", 
                  borderRadius: "50%", 
                  animation: "spin 1s linear infinite" 
                }} />
                Сохранение...
              </span>
            ) : "💾 Сохранить изменения"}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input, textarea, button {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            box-sizing: border-box;
            max-width: 100%;
          }
          
          input:focus, textarea:focus, button:focus {
            outline: none;
            border-color: #1976d2 !important;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
          }
          
          input[type="datetime-local"] {
            min-height: 48px;
          }
          
          input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            padding: 8px;
            margin-right: -8px;
            cursor: pointer;
          }
          
          @supports (padding: max(0px)) {
            div[style*="position: fixed"][style*="top: 0"] {
              padding-top: max(16px, env(safe-area-inset-top, 16px));
            }
            
            div[style*="position: fixed"][style*="bottom: 0"] {
              padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
            }
            
            div[style*="paddingTop: 92px"] {
              padding-top: max(92px, calc(92px + env(safe-area-inset-top, 0px)));
            }
          }
          
          @media (min-width: 768px) {
            div[style*="paddingTop: 92px"] {
              padding: 32px;
              padding-top: 124px;
              padding-bottom: 152px;
              max-width: 600px;
              margin: 0 auto;
            }
            
            div[style*="position: fixed"][style*="top: 0"] {
              padding: 24px 0;
              height: 88px;
            }
            
            div[style*="position: fixed"][style*="top: 0"] > div {
              max-width: 600px;
              margin: 0 auto;
              padding: 0 32px;
              width: 100%;
            }
            
            div[style*="position: fixed"][style*="bottom: 0"] {
              padding: 24px 0;
              height: 104px;
            }
            
            div[style*="position: fixed"][style*="bottom: 0"] > div {
              max-width: 600px;
              margin: 0 auto;
              padding: 0 32px;
              width: 100%;
            }
            
            div[style*="position: fixed"][style*="bottom: 0"] button {
              padding: 18px 24px;
              font-size: 17px;
              min-width: 140px;
            }
            
            div[style*="borderRadius: 16px"] {
              padding: 28px;
              border-radius: 20px;
            }
            
            button[style*="minHeight: 70px"] {
              padding: 18px 12px !important;
              min-height: 80px !important;
              font-size: 15px !important;
            }
            
            span[style*="fontSize: 20px"] {
              font-size: 24px !important;
            }
            
            div[style*="width: 52px"] {
              width: 60px;
              height: 32px;
            }
            
            div[style*="left: 28px;"] {
              left: 32px !important;
            }
          }
          
          @media (max-width: 360px) {
            div[style*="gridTemplateColumns: repeat(3, 1fr)"] {
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
            }
            
            button[style*="minHeight: 70px"] {
              padding: 12px 4px !important;
              min-height: 65px !important;
              font-size: 13px !important;
            }
            
            span[style*="fontSize: 20px"] {
              font-size: 18px !important;
            }
            
            div[style*="paddingTop: 92px"] {
              padding-top: 84px;
              padding-left: 12px;
              padding-right: 12px;
            }
            
            div[style*="position: fixed"][style*="top: 0"] > div {
              padding: 0 12px;
            }
            
            div[style*="position: fixed"][style*="bottom: 0"] > div {
              padding: 0 12px;
            }
          }
        `}
      </style>
    </div>
  );
}