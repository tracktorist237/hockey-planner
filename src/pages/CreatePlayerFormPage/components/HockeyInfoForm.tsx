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
    <div style={{ backgroundColor: "var(--hp-surface)", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "var(--hp-shadow-sm)" }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600", color: "var(--hp-heading)", display: "flex", alignItems: "center", gap: "8px" }}>
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
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "15px", color: "var(--hp-text)" }}>Основная позиция</label>
        <select
          name="primaryPosition"
          value={formData.primaryPosition}
          onChange={onChange}
          style={{ width: "100%", padding: "14px", border: "2px solid var(--hp-border)", borderRadius: "10px", fontSize: "16px", backgroundColor: "var(--hp-input-bg)", boxSizing: "border-box", cursor: "pointer" }}
        >
          <option value={3}>Нападающий (Forward)</option>
          <option value={2}>Защитник (Defender)</option>
          <option value={1}>Вратарь (Goalie)</option>
        </select>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", fontSize: "15px", color: "var(--hp-text)" }}>Хват клюшки *</label>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div
            onClick={() => onChange({ target: { name: "handedness", value: "1" } } as ChangeEvent<HTMLInputElement>)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 20px",
              backgroundColor: formData.handedness === 1 ? "var(--hp-primary-soft)" : "var(--hp-surface-soft)",
              border: `2px solid ${formData.handedness === 1 ? "var(--hp-primary)" : "var(--hp-border)"}`,
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
                border: `2px solid ${formData.handedness === 1 ? "var(--hp-primary)" : "var(--hp-muted)"}`,
                backgroundColor: formData.handedness === 1 ? "var(--hp-primary)" : "var(--hp-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {formData.handedness === 1 && <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--hp-surface)" }} />}
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
              backgroundColor: formData.handedness === 2 ? "var(--hp-primary-soft)" : "var(--hp-surface-soft)",
              border: `2px solid ${formData.handedness === 2 ? "var(--hp-primary)" : "var(--hp-border)"}`,
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
                border: `2px solid ${formData.handedness === 2 ? "var(--hp-primary)" : "var(--hp-muted)"}`,
                backgroundColor: formData.handedness === 2 ? "var(--hp-primary)" : "var(--hp-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {formData.handedness === 2 && <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--hp-surface)" }} />}
            </div>
            <span style={{ fontSize: "15px", fontWeight: formData.handedness === 2 ? "600" : "400" }}>🏒 Правый хват</span>
          </div>
        </div>

        <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: "var(--hp-surface-soft)", borderRadius: "8px", fontSize: "13px", color: "var(--hp-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>💡</span>
          <span>{formData.handedness === 1 ? "Левый хват — правая рука сверху на клюшке" : "Правый хват — левая рука сверху на клюшке"}</span>
        </div>
      </div>
    </div>
  );
}
