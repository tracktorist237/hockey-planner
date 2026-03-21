import { AddressSearchInput } from "src/AddressSearchInput";

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
  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        border: "1px solid #e0e0e0",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#1a237e" }}>
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
            border: "1px solid #e0e0e0",
            borderRadius: "10px",
            fontSize: "16px",
            backgroundColor: "white",
            boxSizing: "border-box",
            maxWidth: "100%",
          }}
        />
      </div>

      <div style={{ marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
          <label style={{ fontWeight: "500", fontSize: "15px", flexShrink: 0 }}>Адрес *</label>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span style={{ fontSize: "14px", color: !useAddressSearch ? "#333" : "#999" }}>✏️ Ручной</span>
            <div
              onClick={onToggleSearch}
              style={{
                position: "relative",
                width: "52px",
                height: "28px",
                backgroundColor: useAddressSearch ? "#4caf50" : "#ddd",
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
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            </div>
            <span style={{ fontSize: "14px", color: useAddressSearch ? "#333" : "#999" }}>🔍 Авто</span>
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
              border: "1px solid #e0e0e0",
              borderRadius: "10px",
              fontSize: "16px",
              resize: "vertical",
              backgroundColor: "white",
              minHeight: "100px",
              boxSizing: "border-box",
              maxWidth: "100%",
            }}
          />
        )}

        <div style={{ marginTop: "10px", fontSize: "13px", color: "#666", display: "flex", alignItems: "flex-start", gap: "6px" }}>
          <span style={{ flexShrink: 0 }}>{useAddressSearch ? "💡" : "📝"}</span>
          <span>
            {useAddressSearch
              ? "Введите улицу и номер дома для поиска. Можно искать по городу или названию места."
              : "Укажите адрес полностью для навигации участников."}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: "0", width: "100%", boxSizing: "border-box" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "15px" }}>
          Номер льда/корта
        </label>
        <input
          value={iceRinkNumber}
          onChange={(e) => onIceRinkNumberChange(e.target.value)}
          placeholder="Например: Лед №1 или Корпус А"
          style={{
            width: "100%",
            padding: "14px",
            border: "1px solid #e0e0e0",
            borderRadius: "10px",
            fontSize: "16px",
            backgroundColor: "white",
            boxSizing: "border-box",
            maxWidth: "100%",
          }}
        />
      </div>
    </div>
  );
};
