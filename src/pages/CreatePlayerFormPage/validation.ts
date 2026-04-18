import { FieldStatus, UserFormData, ValidationErrors, ValidatedFieldName } from "src/pages/CreatePlayerFormPage/types";

export const validateField = (name: ValidatedFieldName, value: unknown): string | undefined => {
  switch (name) {
    case "firstName": {
      if (!value || typeof value !== "string" || value.trim() === "") return "Имя обязательно для заполнения";
      if (value.length < 2) return "Имя должно содержать минимум 2 символа";
      if (value.length > 50) return "Имя не может превышать 50 символов";
      if (!/^[a-zA-Zа-яА-Яё\s-]+$/.test(value)) return "Имя может содержать только буквы, пробелы и дефис";
      return undefined;
    }
    case "lastName": {
      if (!value || typeof value !== "string" || value.trim() === "") return "Фамилия обязательна для заполнения";
      if (value.length < 2) return "Фамилия должна содержать минимум 2 символа";
      if (value.length > 50) return "Фамилия не может превышать 50 символов";
      if (!/^[a-zA-Zа-яА-Яё\s-]+$/.test(value)) return "Фамилия может содержать только буквы, пробелы и дефис";
      return undefined;
    }
    case "jerseyNumber": {
      if (value === null || value === "") return undefined;
      const numberValue = Number.parseInt(String(value), 10);
      if (Number.isNaN(numberValue)) return "Номер должен быть числом";
      if (numberValue < 0) return "Номер не может быть отрицательным";
      if (numberValue > 99) return "Номер не может превышать 99";
      if (!Number.isInteger(numberValue)) return "Номер должен быть целым числом";
      return undefined;
    }
    case "height": {
      if (value === null || value === "") return undefined;
      const numberValue = Number.parseInt(String(value), 10);
      if (Number.isNaN(numberValue)) return "Рост должен быть числом";
      if (numberValue < 100) return "Рост не может быть меньше 100 см";
      if (numberValue > 250) return "Рост не может превышать 250 см";
      if (!Number.isInteger(numberValue)) return "Рост должен быть целым числом";
      return undefined;
    }
    case "weight": {
      if (value === null || value === "") return undefined;
      const numberValue = Number.parseInt(String(value), 10);
      if (Number.isNaN(numberValue)) return "Вес должен быть числом";
      if (numberValue < 30) return "Вес не может быть меньше 30 кг";
      if (numberValue > 200) return "Вес не может превышать 200 кг";
      if (!Number.isInteger(numberValue)) return "Вес должен быть целым числом";
      return undefined;
    }
    case "birthDate": {
      if (value === null || value === "") return undefined;
      const birthDate = new Date(String(value));
      const today = new Date();
      if (Number.isNaN(birthDate.getTime())) return "Некорректная дата рождения";
      if (birthDate > today) return "Дата рождения не может быть в будущем";

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
      }

      if (age < 5) return "Возраст игрока должен быть не менее 5 лет";
      if (age > 100) return "Пожалуйста, проверьте правильность даты рождения";
      return undefined;
    }
    default:
      return undefined;
  }
};

export const getFieldStatus = (
  fieldName: ValidatedFieldName,
  formData: UserFormData,
  errors: ValidationErrors,
): FieldStatus => {
  const value = formData[fieldName as keyof UserFormData] as unknown;
  const error = errors[fieldName];

  if (error) {
    return "error";
  }
  if (value && value !== "" && value !== null) {
    return "success";
  }
  return "default";
};
