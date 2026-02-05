import { useState } from "react";
import { createEvent } from "./api/events";
import { CreateEventDto, EventType } from "./types/events";

interface CreateEventPageProps {
  onBack: () => void;
  onCreated: (id: string) => void;
}

export function CreateEventPage({ onBack, onCreated }: CreateEventPageProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [iceRinkNumber, setIceRinkNumber] = useState("");
  const [leagueName, setLeagueName] = useState("");

  // ✅ Новые поля
  const [homeTeamName, setHomeTeamName] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");

  const [type, setType] = useState<EventType>(EventType.Practice);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const dto: CreateEventDto = {
        title: title || null,
        description: description || null,
        type,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null, // <-- безопасно
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

  const isGame = type === EventType.Game;

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack}>⬅ Назад</button>
      <h2>Добавить событие</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div>
        <label>Тип события</label>
        <select value={type} onChange={(e) => setType(Number(e.target.value))}>
          <option value={EventType.Practice}>Тренировка</option>
          <option value={EventType.Game}>Матч</option>
        </select>
      </div>

      <div>
        <label>Название</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label>Описание</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label>Начало</label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>

      <div>
        <label>Конец</label>
        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>

      <div>
        <label>Локация</label>
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        />
      </div>

      <div>
        <label>Адрес</label>
        <input
          value={locationAddress}
          onChange={(e) => setLocationAddress(e.target.value)}
        />
      </div>

      <div>
        <label>Номер льда</label>
        <input
          value={iceRinkNumber}
          onChange={(e) => setIceRinkNumber(e.target.value)}
        />
      </div>

      {isGame && (
        <>
          <div>
              <label>Лига</label>
              <input
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
              />
          </div>  
          <div>
            <label>Домашняя команда</label>
            <input
              value={homeTeamName}
              onChange={(e) => setHomeTeamName(e.target.value)}
            />
          </div>

          <div>
            <label>Гостевая команда</label>
            <input
              value={awayTeamName}
              onChange={(e) => setAwayTeamName(e.target.value)}
            />
          </div>
        </>
      )}

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Создаём..." : "Создать событие"}
      </button>
    </div>
  );
}
