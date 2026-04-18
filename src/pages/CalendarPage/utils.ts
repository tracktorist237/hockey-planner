import { EventLookUpDto, EventType } from "src/types/events";
import { ViewMode } from "src/pages/CalendarPage/types";
import { getEventTypeColor } from "src/utils/colors";

export const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;

export const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

export const getEventTypeName = (type: EventType): string => {
  switch (type) {
    case EventType.Practice:
      return "Тренировка";
    case EventType.Game:
      return "Матч";
    case EventType.Meeting:
      return "Встреча";
    default:
      return "Событие";
  }
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

export const getUniqueEventColors = (events: EventLookUpDto[]): string[] => {
  const colorMap: Record<string, boolean> = {};
  events.forEach((event) => {
    const color = getEventTypeColor(event.type as EventType);
    colorMap[color] = true;
  });
  return Object.keys(colorMap);
};

export const isSameDay = (left: Date, right: Date): boolean =>
  left.getDate() === right.getDate() &&
  left.getMonth() === right.getMonth() &&
  left.getFullYear() === right.getFullYear();

export const getPeriodLabel = (viewMode: ViewMode, currentDate: Date): string => {
  if (viewMode === "month") {
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }
  return `Неделя ${currentDate.getDate()} ${MONTH_NAMES[currentDate.getMonth()]}`;
};
