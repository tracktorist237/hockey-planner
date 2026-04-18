import { useCallback, useEffect, useState } from "react";
import { ViewMode } from "src/pages/CalendarPage/types";

const MOBILE_BREAKPOINT = 768;

export const useCalendarNavigation = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentDate((previousDate) => {
      if (viewMode === "month") {
        return new Date(previousDate.getFullYear(), previousDate.getMonth() - 1, 1);
      }
      const nextDate = new Date(previousDate);
      nextDate.setDate(previousDate.getDate() - 7);
      return nextDate;
    });
    setSelectedDate(null);
  }, [viewMode]);

  const goNext = useCallback(() => {
    setCurrentDate((previousDate) => {
      if (viewMode === "month") {
        return new Date(previousDate.getFullYear(), previousDate.getMonth() + 1, 1);
      }
      const nextDate = new Date(previousDate);
      nextDate.setDate(previousDate.getDate() + 7);
      return nextDate;
    });
    setSelectedDate(null);
  }, [viewMode]);

  const goToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return {
    viewMode,
    setViewMode,
    currentDate,
    selectedDate,
    setSelectedDate,
    isMobile,
    goPrev,
    goNext,
    goToday,
    selectDate,
  };
};
