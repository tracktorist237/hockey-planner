import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function DeleteEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentUser = (() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  })();

  if (!id) {
    return <div>Некорректный ID события</div>;
  }

  const handleDelete = async () => {
    if (!currentUser?.id) {
      setError("Не найден currentUserId");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/events?currentUserId=${currentUser.id}&eventId=${id}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Ошибка удаления");
      }

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

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)}>⬅ Назад</button>

      <h2>Удаление мероприятия</h2>

      <p>
        Вы точно хотите удалить это событие?  
        Это действие нельзя отменить.
      </p>

      {error && <div style={{ color: "red" }}>Ошибка: {error}</div>}

      {message ? (
        <div style={{ color: "green", fontWeight: "bold" }}>
          {message}
        </div>
      ) : (
        <button
          disabled={loading}
          onClick={handleDelete}
          style={{ background: "#ffebee", marginTop: 12 }}
        >
          🗑 Подтвердить удаление
        </button>
      )}
    </div>
  );
}
