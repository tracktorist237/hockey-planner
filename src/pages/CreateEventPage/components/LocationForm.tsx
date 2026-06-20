import { AddressSearchInput } from "src/AddressSearchInput";
import { useEffect, useState } from "react";
import { AddOptionalSectionButton } from "src/pages/CreateEventPage/components/AddOptionalSectionButton";

interface LocationFormProps {
  locationName: string;
  locationAddress: string;
  iceRinkNumber: string;
  useAddressSearch: boolean;
  onLocationNameChange: (value: string) => void;
  onLocationAddressChange: (value: string) => void;
  onIceRinkNumberChange: (value: string) => void;
  onToggleSearch: () => void;
}

export const LocationForm = ({
  locationName,
  locationAddress,
  iceRinkNumber,
  useAddressSearch,
  onLocationNameChange,
  onLocationAddressChange,
  onIceRinkNumberChange,
  onToggleSearch,
}: LocationFormProps) => {
  const [isIceRinkNumberVisible, setIsIceRinkNumberVisible] = useState(Boolean(iceRinkNumber));

  useEffect(() => {
    if (iceRinkNumber) {
      setIsIceRinkNumberVisible(true);
    }
  }, [iceRinkNumber]);

  return (
    <div
      style={{
        backgroundColor: "var(--hp-surface-soft)",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        border: "1px solid var(--hp-border)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "var(--hp-heading)" }}>
        📍 Место проведения
      </h3>

      <div style={{ marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "15px" }}>
          Название места
        </label>
        <input
          value={locationName}
          onChange={(e) => onLocationNameChange(e.target.value)}
          placeholder="Например: Ледовый дворец 'Арена'"
          style={{
            width: "100%",
            padding: "14px",
            border: "1px solid var(--hp-border)",
            borderRadius: "10px",
            fontSize: "16px",
            backgroundColor: "var(--hp-surface)",
            color: "var(--hp-text)",
            boxSizing: "border-box",
            maxWidth: "100%",
          }}
        />
      </div>

      <div style={{ marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
          <label style={{ fontWeight: "500", fontSize: "15px", flexShrink: 0 }}>Адрес *</label>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span style={{ fontSize: "14px", color: !useAddressSearch ? "var(--hp-text)" : "var(--hp-muted)" }}>✏️ Ручной</span>
            <div
              onClick={onToggleSearch}
              style={{
                position: "relative",
                width: "52px",
                height: "28px",
                backgroundColor: useAddressSearch ? "var(--hp-success)" : "var(--hp-border)",
                borderRadius: "28px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  left: useAddressSearch ? "28px" : "4px",
                  width: "20px",
                  height: "20px",
                  backgroundColor: "var(--hp-surface)",
                  borderRadius: "50%",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            </div>
            <span style={{ fontSize: "14px", color: useAddressSearch ? "var(--hp-text)" : "var(--hp-muted)" }}>🔍 Авто</span>
          </div>
        </div>

        {useAddressSearch ? (
          <div style={{ width: "100%", boxSizing: "border-box" }}>
            <AddressSearchInput
              value={locationAddress}
              onChange={onLocationAddressChange}
              onLocationNameChange={onLocationNameChange}
              locationName={locationName}
              placeholder="Начните вводить адрес..."
            />
          </div>
        ) : (
          <textarea
            value={locationAddress}
            onChange={(e) => onLocationAddressChange(e.target.value)}
            placeholder="Страна, город, улица, дом..."
            rows={3}
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid var(--hp-border)",
              borderRadius: "10px",
              fontSize: "16px",
              resize: "vertical",
              backgroundColor: "var(--hp-surface)",
              color: "var(--hp-text)",
              minHeight: "100px",
              boxSizing: "border-box",
              maxWidth: "100%",
            }}
          />
        )}

      </div>

      {isIceRinkNumberVisible ? (
        <div style={{ marginBottom: "0", width: "100%", boxSizing: "border-box" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "15px" }}>
            Номер льда/корта
          </label>
          <input
            autoFocus={!iceRinkNumber}
            value={iceRinkNumber}
            onChange={(e) => onIceRinkNumberChange(e.target.value)}
            placeholder="Например: Лед №1 или Корпус А"
            style={{
              width: "100%",
              padding: "14px",
              border: "1px solid var(--hp-border)",
              borderRadius: "10px",
              fontSize: "16px",
              backgroundColor: "var(--hp-surface)",
              color: "var(--hp-text)",
              boxSizing: "border-box",
              maxWidth: "100%",
            }}
          />
        </div>
      ) : (
        <AddOptionalSectionButton onClick={() => setIsIceRinkNumberVisible(true)}>
          + Добавить номер льда
        </AddOptionalSectionButton>
      )}
    </div>
  );
};
