// AddressSearchInput.tsx
import { useState, useEffect, useCallback } from "react";

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface AddressSearchInputProps {
  value: string;
  onChange: (address: string) => void;
  onLocationNameChange?: (name: string) => void;
  locationName?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressSearchInput({
  value,
  onChange,
  onLocationNameChange,
  locationName = "",
  placeholder = "Начните вводить адрес...",
  disabled = false
}: AddressSearchInputProps) {
  const [addressQuery, setAddressQuery] = useState(value);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Синхронизируем внутреннее состояние с внешним значением
  useEffect(() => {
    setAddressQuery(value);
  }, [value]);

  // Функция для поиска адресов через OpenStreetMap Nominatim API
  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=ru`,
        {
          headers: {
            'User-Agent': 'HockeyApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Ошибка при поиске адреса');
      }
      
      const data = await response.json();
      setAddressSuggestions(data);
    } catch (error) {
      console.error('Ошибка поиска адреса:', error);
      setAddressSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressQuery && addressQuery.length >= 3) {
        searchAddress(addressQuery);
      } else {
        setAddressSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addressQuery, searchAddress]);

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    const formattedAddress = suggestion.display_name;
    setAddressQuery(formattedAddress);
    onChange(formattedAddress);
    
    // Автоматически заполняем название места, если пустое
    if (onLocationNameChange && !locationName.trim()) {
      const city = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village;
      const road = suggestion.address?.road;
      const houseNumber = suggestion.address?.house_number;
      
      let suggestedName = '';
      if (city && road) {
        suggestedName = `${road}${houseNumber ? ` ${houseNumber}` : ''}, ${city}`;
      } else {
        suggestedName = formattedAddress.split(',')[0] || '';
      }
      
      onLocationNameChange(suggestedName);
    }
    
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAddressQuery(newValue);
    onChange(newValue);
    setShowSuggestions(true);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        value={addressQuery}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "10px 40px 10px 10px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          fontSize: "16px",
          backgroundColor: disabled ? "#f5f5f5" : "white"
        }}
      />
      
      {isSearching && (
        <div style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)"
        }}>
          <div style={{
            width: "16px",
            height: "16px",
            border: "2px solid #ccc",
            borderTopColor: "#1976d2",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
        </div>
      )}
      
      {showSuggestions && !disabled && addressSuggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          zIndex: 1000,
          maxHeight: "300px",
          overflowY: "auto"
        }}>
          {addressSuggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.lat}-${suggestion.lon}-${index}`}
              onClick={() => handleAddressSelect(suggestion)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              style={{
                padding: "10px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                ...(index === addressSuggestions.length - 1 && {
                  borderBottom: "none"
                })
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                {suggestion.address?.road || suggestion.address?.city || 'Адрес'}
                {suggestion.address?.house_number && `, ${suggestion.address.house_number}`}
              </div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                {suggestion.display_name}
              </div>
              <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
                {suggestion.type} • {suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: translateY(-50%) rotate(0deg); }
            100% { transform: translateY(-50%) rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}