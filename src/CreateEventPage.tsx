import { useState, useEffect, useRef } from "react";
import { createEvent } from "./api/events";
import { CreateEventDto, EventType } from "./types/events";
import { AddressSearchInput } from "./AddressSearchInput";

interface CreateEventPageProps {
  onBack: () => void;
  onCreated: (id: string) => void;
}

export function CreateEventPage({ onBack, onCreated }: CreateEventPageProps) {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cancelHover, setCancelHover] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);

  // Новые состояния для управления видимостью хедера и футера
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

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
    setLoading(true);
    setError(null);

    let finalTitle = title;

    if (type === EventType.Practice) {
      finalTitle = "Тренировка";
    } else if (type === EventType.Game) {
      if (homeTeamName && awayTeamName) {
        finalTitle = `${homeTeamName} - ${awayTeamName}`;
      } else {
        setError("Для матча необходимо указать названия команд");
        setLoading(false);
        return;
      }
    } else if (type === EventType.Meeting) {
      if (!title.trim()) {
        setError("Для встречи необходимо указать название");
        setLoading(false);
        return;
      }
    }

    if (!startTime) {
      setError("Необходимо указать дату и время начала");
      setLoading(false);
      return;
    }

    const dto: CreateEventDto = {
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
      const id = await createEvent(dto);
      onCreated(id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик скролла для скрытия/показа хедера и футера
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          // Определяем направление скролла
          const isScrollingDown = currentScrollY > lastScrollY.current;
          const isScrollingUp = currentScrollY < lastScrollY.current;
          
          // Показываем/скрываем хедер
          if (isScrollingDown && currentScrollY > 50) {
            setIsHeaderVisible(false);
          } else if (isScrollingUp) {
            setIsHeaderVisible(true);
          }
          
          // Показываем/скрываем футер
          if (isScrollingDown && currentScrollY > 100) {
            setIsFooterVisible(false);
          } else if (isScrollingUp) {
            setIsFooterVisible(true);
          }
          
          // Если мы вверху страницы, всегда показываем оба элемента
          if (currentScrollY < 10) {
            setIsHeaderVisible(true);
            setIsFooterVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isGame = type === EventType.Game;
  const isMeeting = type === EventType.Meeting;
  const isPractice = type === EventType.Practice;

  return (
    <div style={{
      padding: "0",
      maxWidth: "100%",
      margin: "0 auto",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      boxSizing: "border-box"
    }}>
      
      {/* Хедер - фиксированный с анимацией */}
      <div style={{
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        zIndex: "100",
        backgroundColor: "white",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: isHeaderVisible ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
        padding: "16px",
        height: "76px",
        boxSizing: "border-box",
        transform: isHeaderVisible ? "translateY(0)" : "translateY(-100%)",
        opacity: isHeaderVisible ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease"
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
            onClick={onBack}
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
            Новое событие
          </h1>
        </div>
      </div>

      {/* Основной контент с отступами под хедер и над футером */}
      <div style={{
        padding: "16px",
        paddingTop: "92px",
        paddingBottom: "120px",
        maxWidth: "100%",
        margin: "0 auto",
        boxSizing: "border-box"
      }}>

        {/* Контейнер формы с ограничением по ширине */}
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
                    Лига (необязательно)
                  </label>
                  <input
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="Например: Высшая лига"
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
                  
                  {/* Тумблер */}
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

          </div> {/* Конец карточки формы */}
        </div> {/* Конец контейнера формы */}
      </div> {/* Конец основного контента */}

      {/* Футер - фиксированный с анимацией */}
      <div style={{ 
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        backgroundColor: "white",
        padding: "16px",
        borderTop: "1px solid #e0e0e0",
        boxShadow: isFooterVisible ? "0 -2px 10px rgba(0,0,0,0.1)" : "none",
        display: "flex",
        gap: "12px",
        zIndex: "100",
        boxSizing: "border-box",
        height: "88px",
        transform: isFooterVisible ? "translateY(0)" : "translateY(100%)",
        opacity: isFooterVisible ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease"
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
            onClick={onBack}
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
            disabled={loading}
            onMouseEnter={() => !loading && setSubmitHover(true)}
            onMouseLeave={() => setSubmitHover(false)}
            style={{
              padding: "16px 20px",
              border: "none",
              background: loading ? "#78909c" : (submitHover ? "#1565c0" : "#1976d2"),
              color: "white",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "600",
              flex: 2,
              minWidth: "180px",
              boxSizing: "border-box",
              transition: "all 0.2s ease",
              transform: (submitHover && !loading) ? "translateY(-1px)" : "none"
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
                Создание...
              </span>
            ) : "✅ Создать событие"}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Общие стили для всех устройств */
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
          
          /* Улучшение для мобильного datetime-local */
          input[type="datetime-local"] {
            min-height: 48px;
          }
          
          input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            padding: 8px;
            margin-right: -8px;
            cursor: pointer;
          }
          
          /* Безопасные зоны для современных телефонов */
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
          
          /* Для ПК - улучшенная адаптация */
          @media (min-width: 768px) {
            /* Основной контейнер */
            div[style*="padding: 0"] {
              padding: 0;
              max-width: 100%;
            }
            
            /* Контейнер контента */
            div[style*="paddingTop: 92px"] {
              padding: 32px;
              padding-top: 124px; /* 92px + 32px отступ */
              padding-bottom: 152px; /* 120px + 32px отступ */
              max-width: 600px;
              margin: 0 auto;
            }
            
            /* Хедер для ПК - фиксированный, но с центрированием */
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
            
            /* Футер для ПК - фиксированный, но с центрированием */
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
            
            /* Кнопки в футере для ПК */
            div[style*="position: fixed"][style*="bottom: 0"] button {
              padding: 18px 24px;
              font-size: 17px;
              min-width: 140px;
            }
            
            /* Улучшение для полей ввода на ПК */
            input, textarea {
              font-size: 15px;
              padding: 15px 18px;
            }
            
            /* Увеличение тумблера на ПК */
            div[style*="width: 52px"] {
              width: 60px;
              height: 32px;
            }
            
            div[style*="left: 28px;"] {
              left: 32px !important;
            }
            
            /* Карточка формы */
            div[style*="borderRadius: 16px"] {
              padding: 28px;
              border-radius: 20px;
            }
            
            /* Кнопки выбора типа события */
            button[style*="minHeight: 70px"] {
              padding: 18px 12px !important;
              min-height: 80px !important;
              font-size: 15px !important;
            }
            
            span[style*="fontSize: 20px"] {
              font-size: 24px !important;
            }
          }
          
          /* Для больших экранов */
          @media (min-width: 1024px) {
            div[style*="paddingTop: 92px"] {
              max-width: 700px;
            }
            
            div[style*="position: fixed"][style*="top: 0"] > div {
              max-width: 700px;
            }
            
            div[style*="position: fixed"][style*="bottom: 0"] > div {
              max-width: 700px;
            }
          }
          
          /* Для очень больших экранов */
          @media (min-width: 1200px) {
            div[style*="paddingTop: 92px"] {
              max-width: 800px;
            }
            
            div[style*="position: fixed"][style*="top: 0"] > div {
              max-width: 800px;
            }
            
            div[style*="position: fixed"][style*="bottom: 0"] > div {
              max-width: 800px;
            }
            
            div[style*="borderRadius: 16px"] {
              padding: 32px;
            }
          }
          
          /* Для очень маленьких экранов */
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
            
            div[style*="height: 76px"] {
              height: 68px;
              padding: 12px;
            }
            
            div[style*="height: 88px"] {
              height: 80px;
              padding: 12px;
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