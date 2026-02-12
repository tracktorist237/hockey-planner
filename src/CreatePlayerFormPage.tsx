import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserFormData {
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  primaryPosition: number; // 1: Goalie, 2: Defender, 3: Forward
  handedness: number; // 1: Left, 2: Right
  height?: number | null;
  weight?: number | null;
  birthDate?: string | null;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  jerseyNumber?: string;
  height?: string;
  weight?: string;
  birthDate?: string;
}

export function CreatePlayerFormPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    jerseyNumber: null,
    primaryPosition: 3, // Forward по умолчанию
    handedness: 2, // Right по умолчанию
    height: null,
    weight: null,
    birthDate: null,
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Валидация полей
  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "firstName":
        if (!value || value.trim() === "") return "Имя обязательно для заполнения";
        if (value.length < 2) return "Имя должно содержать минимум 2 символа";
        if (value.length > 50) return "Имя не может превышать 50 символов";
        if (!/^[a-zA-Zа-яА-Яё\s-]+$/.test(value)) return "Имя может содержать только буквы, пробелы и дефис";
        return undefined;

      case "lastName":
        if (!value || value.trim() === "") return "Фамилия обязательна для заполнения";
        if (value.length < 2) return "Фамилия должна содержать минимум 2 символа";
        if (value.length > 50) return "Фамилия не может превышать 50 символов";
        if (!/^[a-zA-Zа-яА-Яё\s-]+$/.test(value)) return "Фамилия может содержать только буквы, пробелы и дефис";
        return undefined;

      case "jerseyNumber":
        if (value === null || value === "") return undefined;
        const num = parseInt(value, 10);
        if (isNaN(num)) return "Номер должен быть числом";
        if (num < 0) return "Номер не может быть отрицательным";
        if (num > 99) return "Номер не может превышать 99";
        if (!Number.isInteger(num)) return "Номер должен быть целым числом";
        return undefined;

      case "height":
        if (value === null || value === "") return undefined;
        const height = parseInt(value, 10);
        if (isNaN(height)) return "Рост должен быть числом";
        if (height < 100) return "Рост не может быть меньше 100 см";
        if (height > 250) return "Рост не может превышать 250 см";
        if (!Number.isInteger(height)) return "Рост должен быть целым числом";
        return undefined;

      case "weight":
        if (value === null || value === "") return undefined;
        const weight = parseInt(value, 10);
        if (isNaN(weight)) return "Вес должен быть числом";
        if (weight < 30) return "Вес не может быть меньше 30 кг";
        if (weight > 200) return "Вес не может превышать 200 кг";
        if (!Number.isInteger(weight)) return "Вес должен быть целым числом";
        return undefined;

      case "birthDate":
        if (value === null || value === "") return undefined;
        const birthDate = new Date(value);
        const today = new Date();
        
        if (isNaN(birthDate.getTime())) return "Некорректная дата рождения";
        
        // Проверка, что дата не в будущем
        if (birthDate > today) return "Дата рождения не может быть в будущем";
        
        // Расчет возраста
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 5) return "Возраст игрока должен быть не менее 5 лет";
        if (age > 100) return "Пожалуйста, проверьте правильность даты рождения";
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Очищаем ошибку для текущего поля
    setErrors(prev => ({ ...prev, [name]: undefined }));
    setError(null);
    
    if (name === "jerseyNumber" || name === "height" || name === "weight") {
      const numValue = value === "" ? null : parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: numValue }));
      
      // Валидация после обновления
      const fieldError = validateField(name, numValue);
      if (fieldError) {
        setErrors(prev => ({ ...prev, [name]: fieldError }));
      }
    } else if (name === "primaryPosition" || name === "handedness") {
      const numValue = parseInt(value, 10);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else if (name === "birthDate") {
      setFormData(prev => ({ ...prev, [name]: value || null }));
      
      // Валидация после обновления
      const fieldError = validateField(name, value);
      if (fieldError) {
        setErrors(prev => ({ ...prev, [name]: fieldError }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Валидация после обновления
      const fieldError = validateField(name, value);
      if (fieldError) {
        setErrors(prev => ({ ...prev, [name]: fieldError }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Валидация обязательных полей
    const firstNameError = validateField("firstName", formData.firstName);
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const lastNameError = validateField("lastName", formData.lastName);
    if (lastNameError) newErrors.lastName = lastNameError;
    
    // Валидация опциональных полей
    if (formData.jerseyNumber !== null && formData.jerseyNumber !== undefined) {
      const jerseyError = validateField("jerseyNumber", formData.jerseyNumber);
      if (jerseyError) newErrors.jerseyNumber = jerseyError;
    }
    
    if (formData.height !== null && formData.height !== undefined) {
      const heightError = validateField("height", formData.height);
      if (heightError) newErrors.height = heightError;
    }
    
    if (formData.weight !== null && formData.weight !== undefined) {
      const weightError = validateField("weight", formData.weight);
      if (weightError) newErrors.weight = weightError;
    }
    
    if (formData.birthDate !== null && formData.birthDate !== undefined) {
      const birthDateError = validateField("birthDate", formData.birthDate);
      if (birthDateError) newErrors.birthDate = birthDateError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("Пожалуйста, исправьте ошибки в форме");
      return;
    }

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
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Ошибка создания пользователя: ${response.status}`);
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

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getFieldStatus = (fieldName: string) => {
    const value = formData[fieldName as keyof UserFormData];
    const error = errors[fieldName as keyof ValidationErrors];
    
    if (error) return "error";
    if (value && value !== "" && value !== null) return "success";
    return "default";
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
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "8px"
        }}>
          <button 
            onClick={() => navigate("/")}
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
            fontSize: "22px",
            fontWeight: "600",
            color: "#1a237e"
          }}>
            Создание анкеты игрока
          </h1>
        </div>
        <p style={{
          margin: "0",
          fontSize: "15px",
          color: "#666",
          lineHeight: "1.5"
        }}>
          Заполните информацию о себе, чтобы участвовать в мероприятиях команды
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: "#ffebee",
          color: "#c62828",
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "20px",
          fontSize: "15px",
          borderLeft: "4px solid #c62828",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Основная информация */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "600",
            color: "#1a237e",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>👤</span>
            <span>Личная информация</span>
          </h3>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "600",
              fontSize: "15px",
              color: "#333"
            }}>
              Имя *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  border: `2px solid ${
                    getFieldStatus("firstName") === "error" ? "#d32f2f" :
                    getFieldStatus("firstName") === "success" ? "#4caf50" : "#e0e0e0"
                  }`,
                  borderRadius: "10px",
                  fontSize: "16px",
                  backgroundColor: "#fafafa",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease"
                }}
                placeholder="Введите имя"
              />
              {getFieldStatus("firstName") === "success" && (
                <span style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4caf50",
                  fontSize: "18px"
                }}>
                  ✓
                </span>
              )}
            </div>
            {errors.firstName && (
              <div style={{ 
                marginTop: "6px", 
                fontSize: "13px", 
                color: "#d32f2f",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <span>⚠️</span>
                <span>{errors.firstName}</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "600",
              fontSize: "15px",
              color: "#333"
            }}>
              Фамилия *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "14px",
                  border: `2px solid ${
                    getFieldStatus("lastName") === "error" ? "#d32f2f" :
                    getFieldStatus("lastName") === "success" ? "#4caf50" : "#e0e0e0"
                  }`,
                  borderRadius: "10px",
                  fontSize: "16px",
                  backgroundColor: "#fafafa",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease"
                }}
                placeholder="Введите фамилию"
              />
              {getFieldStatus("lastName") === "success" && (
                <span style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4caf50",
                  fontSize: "18px"
                }}>
                  ✓
                </span>
              )}
            </div>
            {errors.lastName && (
              <div style={{ 
                marginTop: "6px", 
                fontSize: "13px", 
                color: "#d32f2f",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <span>⚠️</span>
                <span>{errors.lastName}</span>
              </div>
            )}
          </div>

          <div style={{ 
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "16px"
          }}>
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "600",
                fontSize: "15px",
                color: "#333"
              }}>
                Рост (см)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  name="height"
                  value={formData.height || ""}
                  onChange={handleChange}
                  min="100"
                  max="250"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: `2px solid ${
                      getFieldStatus("height") === "error" ? "#d32f2f" :
                      getFieldStatus("height") === "success" ? "#4caf50" : "#e0e0e0"
                    }`,
                    borderRadius: "10px",
                    fontSize: "16px",
                    backgroundColor: "#fafafa",
                    boxSizing: "border-box"
                  }}
                  placeholder="Например: 180"
                />
                {getFieldStatus("height") === "success" && (
                  <span style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#4caf50",
                    fontSize: "18px"
                  }}>
                    ✓
                  </span>
                )}
              </div>
              {errors.height && (
                <div style={{ 
                  marginTop: "6px", 
                  fontSize: "13px", 
                  color: "#d32f2f",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <span>⚠️</span>
                  <span>{errors.height}</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontWeight: "600",
                fontSize: "15px",
                color: "#333"
              }}>
                Вес (кг)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight || ""}
                  onChange={handleChange}
                  min="30"
                  max="200"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: `2px solid ${
                      getFieldStatus("weight") === "error" ? "#d32f2f" :
                      getFieldStatus("weight") === "success" ? "#4caf50" : "#e0e0e0"
                    }`,
                    borderRadius: "10px",
                    fontSize: "16px",
                    backgroundColor: "#fafafa",
                    boxSizing: "border-box"
                  }}
                  placeholder="Например: 75"
                />
                {getFieldStatus("weight") === "success" && (
                  <span style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#4caf50",
                    fontSize: "18px"
                  }}>
                    ✓
                  </span>
                )}
              </div>
              {errors.weight && (
                <div style={{ 
                  marginTop: "6px", 
                  fontSize: "13px", 
                  color: "#d32f2f",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <span>⚠️</span>
                  <span>{errors.weight}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "600",
              fontSize: "15px",
              color: "#333"
            }}>
              Дата рождения
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate || ""}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: "100%",
                  padding: "14px",
                  border: `2px solid ${
                    getFieldStatus("birthDate") === "error" ? "#d32f2f" :
                    getFieldStatus("birthDate") === "success" ? "#4caf50" : "#e0e0e0"
                  }`,
                  borderRadius: "10px",
                  fontSize: "16px",
                  backgroundColor: "#fafafa",
                  boxSizing: "border-box"
                }}
              />
              {getFieldStatus("birthDate") === "success" && (
                <span style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4caf50",
                  fontSize: "18px"
                }}>
                  ✓
                </span>
              )}
            </div>
            {formData.birthDate && !errors.birthDate && (
              <div style={{ 
                marginTop: "8px",
                fontSize: "14px",
                color: "#666",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span>🎂</span>
                <span>Возраст: {calculateAge(formData.birthDate)} лет</span>
              </div>
            )}
            {errors.birthDate && (
              <div style={{ 
                marginTop: "6px", 
                fontSize: "13px", 
                color: "#d32f2f",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <span>⚠️</span>
                <span>{errors.birthDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Хоккейная информация */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "600",
            color: "#1a237e",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>🏒</span>
            <span>Хоккейная информация</span>
          </h3>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "600",
              fontSize: "15px",
              color: "#333"
            }}>
              Игровой номер
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                name="jerseyNumber"
                value={formData.jerseyNumber || ""}
                onChange={handleChange}
                min="0"
                max="99"
                style={{
                  width: "100%",
                  padding: "14px",
                  border: `2px solid ${
                    getFieldStatus("jerseyNumber") === "error" ? "#d32f2f" :
                    getFieldStatus("jerseyNumber") === "success" ? "#4caf50" : "#e0e0e0"
                  }`,
                  borderRadius: "10px",
                  fontSize: "16px",
                  backgroundColor: "#fafafa",
                  boxSizing: "border-box"
                }}
                placeholder="Выберите номер (1-99)"
              />
              {getFieldStatus("jerseyNumber") === "success" && (
                <span style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4caf50",
                  fontSize: "18px"
                }}>
                  ✓
                </span>
              )}
            </div>
            {errors.jerseyNumber && (
              <div style={{ 
                marginTop: "6px", 
                fontSize: "13px", 
                color: "#d32f2f",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <span>⚠️</span>
                <span>{errors.jerseyNumber}</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "600",
              fontSize: "15px",
              color: "#333"
            }}>
              Основная позиция
            </label>
            <select
              name="primaryPosition"
              value={formData.primaryPosition}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px",
                border: "2px solid #e0e0e0",
                borderRadius: "10px",
                fontSize: "16px",
                backgroundColor: "#fafafa",
                boxSizing: "border-box",
                cursor: "pointer"
              }}
            >
              <option value={3}>Нападающий (Forward)</option>
              <option value={2}>Защитник (Defender)</option>
              <option value={1}>Вратарь (Goalie)</option>
            </select>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "12px", 
              fontWeight: "600",
              fontSize: "15px",
              color: "#333"
            }}>
              Хват клюшки *
            </label>
            <div style={{ 
              display: "flex", 
              gap: "20px",
              flexWrap: "wrap"
            }}>
              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px",
                padding: "12px 16px",
                backgroundColor: formData.handedness === 1 ? "#e3f2fd" : "#fafafa",
                border: `2px solid ${formData.handedness === 1 ? "#1976d2" : "#e0e0e0"}`,
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flex: 1
              }}>
                <input
                  type="radio"
                  name="handedness"
                  value={1}
                  checked={formData.handedness === 1}
                  onChange={handleChange}
                  style={{ margin: 0 }}
                />
                <span style={{ fontSize: "15px", fontWeight: formData.handedness === 1 ? "600" : "400" }}>
                  🏒 Левый хват
                </span>
              </label>
              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px",
                padding: "12px 16px",
                backgroundColor: formData.handedness === 2 ? "#e3f2fd" : "#fafafa",
                border: `2px solid ${formData.handedness === 2 ? "#1976d2" : "#e0e0e0"}`,
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flex: 1
              }}>
                <input
                  type="radio"
                  name="handedness"
                  value={2}
                  checked={formData.handedness === 2}
                  onChange={handleChange}
                  style={{ margin: 0 }}
                />
                <span style={{ fontSize: "15px", fontWeight: formData.handedness === 2 ? "600" : "400" }}>
                  🏒 Правый хват
                </span>
              </label>
            </div>
            <div style={{ 
              marginTop: "12px",
              padding: "10px 14px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#666",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span style={{ fontSize: "16px" }}>💡</span>
              <span>
                {formData.handedness === 1 
                  ? "Левый хват — правая рука сверху на клюшке" 
                  : "Правый хват — левая рука сверху на клюшке"}
              </span>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{ 
            display: "flex", 
            gap: "12px",
            flexDirection: "column"
          }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "16px 24px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = "#1565c0";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = "#1976d2";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {submitting ? (
                <>
                  <span style={{ 
                    width: "16px", 
                    height: "16px", 
                    border: "2px solid rgba(255,255,255,0.3)", 
                    borderTopColor: "white", 
                    borderRadius: "50%", 
                    animation: "spin 1s linear infinite" 
                  }} />
                  <span>Создание анкеты...</span>
                </>
              ) : (
                <>
                  <span>➕</span>
                  <span>Создать анкету игрока</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                width: "100%",
                padding: "14px 24px",
                backgroundColor: "#f5f5f5",
                color: "#666",
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease"
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
          </div>
        </div>
      </form>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          input:focus, select:focus {
            outline: none;
            border-color: #1976d2 !important;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
          }
          
          /* Стили для date input */
          input[type="date"] {
            appearance: none;
            -webkit-appearance: none;
            padding: 14px;
            font-family: inherit;
          }
          
          input[type="date"]::-webkit-calendar-picker-indicator {
            padding: 8px;
            margin-right: -8px;
            cursor: pointer;
          }
          
          /* Для очень маленьких экранов */
          @media (max-width: 360px) {
            div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }
            
            div[style*="padding: 20px"] {
              padding: 16px !important;
            }
            
            button[style*="padding: 16px 24px"] {
              padding: 14px 20px !important;
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
          }
        `}
      </style>
    </div>
  );
}