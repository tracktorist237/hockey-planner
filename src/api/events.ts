import { apiGet } from "./client";

export type EventLookUpDto = {
  id: string;
  title?: string;
  startTime: string;
  endTime: string;
};

export type EventListDto = {
  events?: EventLookUpDto[];
};

export function getEvents() {
  return apiGet<EventListDto>("/api/events");
}