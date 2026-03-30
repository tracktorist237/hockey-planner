import { EventLookUpDto } from "src/types/events";

export type ViewMode = "month" | "week";

export interface WeekDayData {
  date: Date;
  events: EventLookUpDto[];
}
