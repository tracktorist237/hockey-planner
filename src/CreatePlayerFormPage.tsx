import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserFormData {
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  primaryPosition: number; // 1: Goalie, 2: Defender, 3: Forward
  handedness: number; // 1: Left, 2: Right
}

export function CreatePlayerFormPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    jerseyNumber: null,
    primaryPosition: 3, // Forward по умолчанию
    handedness: 2, // Right по умолчанию
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "jerseyNumber") {
      const numValue = value === "" ? null : parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else if (name === "primaryPosition" || name === "handedness") {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role: 3, // По умолчанию UserRole = 3
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка создания пользователя: ${response.status}`);
      }

      const createdUser = await response.json();
      
      // Сохраняем созданного пользователя в localStorage
      localStorage.setItem("currentUser", JSON.stringify(createdUser));
      
      // Переходим к списку мероприятий
      navigate("/events");
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при создании анкеты");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: "0 auto" }}>
      <h2>Создание анкеты игрока</h2>
      
      <button 
        onClick={() => navigate("/")}
        style={{ marginBottom: 20 }}
      >
        ← Назад к поиску
      </button>

      {error && (
        <div style={{ color: "red", marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Имя *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="Введите имя"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Фамилия *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="Введите фамилию"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Игровой номер
          </label>
          <input
            type="number"
            name="jerseyNumber"
            value={formData.jerseyNumber || ""}
            onChange={handleChange}
            min="0"
            max="99"
            style={{ width: "100%", padding: 8 }}
            placeholder="Необязательно"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Основная позиция *
          </label>
          <select
            name="primaryPosition"
            value={formData.primaryPosition}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          >
            <option value={3}>Нападающий (Forward)</option>
            <option value={2}>Защитник (Defender)</option>
            <option value={1}>Вратарь (Goalie)</option>
          </select>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            {formData.primaryPosition === 1 && "Вратарь — защита ворот"}
            {formData.primaryPosition === 2 && "Защитник — оборона и поддержка атаки"}
            {formData.primaryPosition === 3 && "Нападающий — атака и голы"}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Хват клюшки *
          </label>
          <div style={{ display: "flex", gap: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="radio"
                name="handedness"
                value={1}
                checked={formData.handedness === 1}
                onChange={handleChange}
              />
              Левый хват (Left)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="radio"
                name="handedness"
                value={2}
                checked={formData.handedness === 2}
                onChange={handleChange}
              />
              Правый хват (Right)
            </label>
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            {formData.handedness === 1 ? "Левый хват — правая рука сверху на клюшке" : "Правый хват — левая рука сверху на клюшке"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: "10px 20px", background: "#007bff", color: "white", border: "none", borderRadius: 4 }}
          >
            {submitting ? "Создание..." : "Создать анкету"}
          </button>
          
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ padding: "10px 20px", background: "#6c757d", color: "white", border: "none", borderRadius: 4 }}
          >
            Отмена
          </button>
        </div>
      </form>

      <div style={{ marginTop: 24, padding: 16, background: "#f8f9fa", borderRadius: 4 }}>
        <h4>Что такое хват клюшки?</h4>
        <p style={{ fontSize: 14 }}>
          <strong>Левый хват (Left)</strong> — правая рука располагается сверху на клюшке, левая снизу.<br/>
          <strong>Правый хват (Right)</strong> — левая рука сверху, правая снизу.
        </p>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Хват влияет на удобство ведения шайбы и выполнения бросков.
        </p>
      </div>
    </div>
  );
}