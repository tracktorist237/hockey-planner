import { MouseEvent } from "react";
import { CurrentPlayerHeader } from "src/CurrentPlayerHeader";
import { ViewMode } from "src/pages/CalendarPage/types";
import { getPeriodLabel } from "src/pages/CalendarPage/utils";

interface CalendarHeaderProps {
  onBack: () => void;
  viewMode: ViewMode;
  isMobile: boolean;
  currentDate: Date;
  onViewModeChange: (mode: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({ onBack, viewMode, isMobile, currentDate, onViewModeChange, onPrev, onNext, onToday }: CalendarHeaderProps) {
  const handleBackHover = (event: MouseEvent<HTMLButtonElement>, isEnter: boolean) => {
    event.currentTarget.style.backgroundColor = isEnter ? "#f5f5f5" : "white";
    event.currentTarget.style.borderColor = isEnter ? "#1976d2" : "#e0e0e0";
  };

  return (
    <>
      <div style={{ backgroundColor: "white", padding: "16px", borderBottom: "1px solid #e0e0e0", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={onBack}
            onMouseEnter={(event) => handleBackHover(event, true)}
            onMouseLeave={(event) => handleBackHover(event, false)}
            style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e0e0", background: "white", fontSize: "20px", cursor: "pointer", borderRadius: "10px", marginRight: "12px", flexShrink: 0, transition: "all 0.2s ease" }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <CurrentPlayerHeader />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#1a237e", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📅</span>
          <span>Календарь мероприятий</span>
        </h1>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "space-between", gap: isMobile ? "16px" : 0 }}>
          <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
            <button onClick={() => onViewModeChange("month")} style={{ padding: "10px 20px", backgroundColor: viewMode === "month" ? "#1976d2" : "#f5f5f5", color: viewMode === "month" ? "white" : "#333", border: "1px solid #e0e0e0", borderRadius: "10px", fontSize: "15px", fontWeight: viewMode === "month" ? "600" : "500", cursor: "pointer", flex: isMobile ? 1 : "auto" }}>Месяц</button>
            <button onClick={() => onViewModeChange("week")} style={{ padding: "10px 20px", backgroundColor: viewMode === "week" ? "#1976d2" : "#f5f5f5", color: viewMode === "week" ? "white" : "#333", border: "1px solid #e0e0e0", borderRadius: "10px", fontSize: "15px", fontWeight: viewMode === "week" ? "600" : "500", cursor: "pointer", flex: isMobile ? 1 : "auto" }}>Неделя</button>
          </div>

          <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
            <button onClick={onPrev} style={{ padding: "10px 16px", backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "10px", fontSize: "14px", cursor: "pointer", flex: isMobile ? 1 : "auto" }}>←</button>
            <button onClick={onToday} style={{ padding: "10px 16px", backgroundColor: "#1976d2", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "500", cursor: "pointer", flex: isMobile ? 2 : "auto" }}>Сегодня</button>
            <button onClick={onNext} style={{ padding: "10px 16px", backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "10px", fontSize: "14px", cursor: "pointer", flex: isMobile ? 1 : "auto" }}>→</button>
          </div>
        </div>

        <div style={{ marginTop: "16px", textAlign: "center", fontSize: isMobile ? "18px" : "22px", fontWeight: "600", color: "#1a237e" }}>
          {getPeriodLabel(viewMode, currentDate)}
        </div>
      </div>
    </>
  );
}
