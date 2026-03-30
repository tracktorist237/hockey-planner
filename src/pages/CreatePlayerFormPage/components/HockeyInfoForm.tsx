import { ChangeEvent } from "react";
import { FieldWithValidation } from "src/pages/CreatePlayerFormPage/components/FieldWithValidation";
import { UserFormData, ValidationErrors, ValidatedFieldName } from "src/pages/CreatePlayerFormPage/types";

interface HockeyInfoFormProps {
  formData: UserFormData;
  errors: ValidationErrors;
  getFieldStatus: (field: ValidatedFieldName) => "default" | "success" | "error";
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function HockeyInfoForm({ formData, errors, getFieldStatus, onChange }: HockeyInfoFormProps) {
  return (
    <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "#1a237e", display: "flex", alignItems: "center", gap: "8px" }}>
        <span>🏒</span>
        <span>Хоккейная информация</span>
      </h3>

      <FieldWithValidation
        label="Игровой номер"
        name="jerseyNumber"
        type="number"
        value={formData.jerseyNumber}
        onChange={onChange as (event: ChangeEvent<HTMLInputElement>) => void}
        status={getFieldStatus("jerseyNumber")}
        error={errors.jerseyNumber}
        placeholder="Выберите номер (1-99)"
        min={0}
        max={99}
      />

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "15px", color: "#333" }}>Основная позиция</label>
        <select
          name="primaryPosition"
          value={formData.primaryPosition}
          onChange={onChange}
          style={{ width: "100%", padding: "14px", border: "2px solid #e0e0e0", borderRadius: "10px", fontSize: "16px", backgroundColor: "#fafafa", boxSizing: "border-box", cursor: "pointer" }}
        >
          <option value={3}>Нападающий (Forward)</option>
          <option value={2}>Защитник (Defender)</option>
          <option value={1}>Вратарь (Goalie)</option>
        </select>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", fontSize: "15px", color: "#333" }}>Хват клюшки *</label>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div
            onClick={() => onChange({ target: { name: "handedness", value: "1" } } as ChangeEvent<HTMLInputElement>)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 20px",
              backgroundColor: formData.handedness === 1 ? "#e3f2fd" : "#f5f5f5",
              border: `2px solid ${formData.handedness === 1 ? "#1976d2" : "#e0e0e0"}`,
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: `2px solid ${formData.handedness === 1 ? "#1976d2" : "#999"}`,
                backgroundColor: formData.handedness === 1 ? "#1976d2" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {formData.handedness === 1 && <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "white" }} />}
            </div>
            <span style={{ fontSize: "15px", fontWeight: formData.handedness === 1 ? "600" : "400" }}>🏒 Левый хват</span>
          </div>

          <div
            onClick={() => onChange({ target: { name: "handedness", value: "2" } } as ChangeEvent<HTMLInputElement>)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 20px",
              backgroundColor: formData.handedness === 2 ? "#e3f2fd" : "#f5f5f5",
              border: `2px solid ${formData.handedness === 2 ? "#1976d2" : "#e0e0e0"}`,
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: `2px solid ${formData.handedness === 2 ? "#1976d2" : "#999"}`,
                backgroundColor: formData.handedness === 2 ? "#1976d2" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {formData.handedness === 2 && <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "white" }} />}
            </div>
            <span style={{ fontSize: "15px", fontWeight: formData.handedness === 2 ? "600" : "400" }}>🏒 Правый хват</span>
          </div>
        </div>

        <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: "#f8f9fa", borderRadius: "8px", fontSize: "13px", color: "#666", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>💡</span>
          <span>{formData.handedness === 1 ? "Левый хват — правая рука сверху на клюшке" : "Правый хват — левая рука сверху на клюшке"}</span>
        </div>
      </div>
    </div>
  );
}