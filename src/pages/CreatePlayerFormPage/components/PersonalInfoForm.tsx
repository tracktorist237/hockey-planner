import { ChangeEvent } from "react";
import { FieldWithValidation } from "src/pages/CreatePlayerFormPage/components/FieldWithValidation";
import { UserFormData, ValidationErrors, ValidatedFieldName } from "src/pages/CreatePlayerFormPage/types";

interface PersonalInfoFormProps {
  formData: UserFormData;
  errors: ValidationErrors;
  getFieldStatus: (field: ValidatedFieldName) => "default" | "success" | "error";
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  calculateAge: (birthDate: string) => number | null;
}

export function PersonalInfoForm({ formData, errors, getFieldStatus, onChange, calculateAge }: PersonalInfoFormProps) {
  return (
    <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "var(--hp-heading)", display: "flex", alignItems: "center", gap: "8px" }}>
        <span>👤</span>
        <span>Личная информация</span>
      </h3>

      <FieldWithValidation label="Имя" name="firstName" value={formData.firstName} onChange={onChange as (event: ChangeEvent<HTMLInputElement>) => void} status={getFieldStatus("firstName")} error={errors.firstName} placeholder="Введите имя" required />
      <FieldWithValidation label="Фамилия" name="lastName" value={formData.lastName} onChange={onChange as (event: ChangeEvent<HTMLInputElement>) => void} status={getFieldStatus("lastName")} error={errors.lastName} placeholder="Введите фамилию" required />
      <FieldWithValidation label="Телефон" name="phone" type="tel" value={formData.phone} onChange={onChange as (event: ChangeEvent<HTMLInputElement>) => void} status="default" placeholder="Номер для связи" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <FieldWithValidation label="Рост (см)" name="height" type="number" value={formData.height} onChange={onChange as (event: ChangeEvent<HTMLInputElement>) => void} status={getFieldStatus("height")} error={errors.height} placeholder="Например: 180" min={100} max={250} />
        </div>
        <div>
          <FieldWithValidation label="Вес (кг)" name="weight" type="number" value={formData.weight} onChange={onChange as (event: ChangeEvent<HTMLInputElement>) => void} status={getFieldStatus("weight")} error={errors.weight} placeholder="Например: 75" min={30} max={200} />
        </div>
      </div>

      <FieldWithValidation
        label="Дата рождения"
        name="birthDate"
        type="date"
        value={formData.birthDate}
        onChange={onChange as (event: ChangeEvent<HTMLInputElement>) => void}
        status={getFieldStatus("birthDate")}
        error={errors.birthDate}
        max={new Date().toISOString().split("T")[0]}
        allowManualDateInput
      />

      {formData.birthDate && !errors.birthDate && (
        <div style={{ marginTop: "8px", fontSize: "14px", color: "var(--hp-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>🎂</span>
          <span>Возраст: {calculateAge(formData.birthDate)} лет</span>
        </div>
      )}
    </div>
  );
}
