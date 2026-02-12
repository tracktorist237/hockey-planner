export enum EventType {
  Practice = 1,
  Game = 2,
  Meeting = 3,
}

export interface EventLookUpDto {
  id: string;
  title?: string;
  description?: string;
  type: number;
  startTime: string; // ISO date
  status: number;
  locationName?: string;
  locationAddress?: string;
  iceRinkNumber?: string;
  leagueName?: string | null;
}

export interface EventListDto {
  events?: EventLookUpDto[];
}

export interface LineDto {
  id: string;
  name?: string;
  order: number;
  members?: PlayerLookUpDto[];
}

export interface PlayerLookUpDto {
  userId: string;
  playerId: string;
  jerseyNumber?: number;
  firstName?: string;
  lastName?: string;
  role: number;
}

export interface AttendanceLookUpDto {
  userId: string;
  jerseyNumber?: number;
  firstName?: string;
  lastName?: string;
  primaryPosition: number;
  handedness: number;
  status: number;
  respondedAt: string;
  notes?: string;
}

export interface EventDto {
  id: string;
  title?: string;
  description?: string;
  type: number;
  startTime: string;
  status: number;
  locationName?: string;
  locationAddress?: string;
  iceRinkNumber?: string;
  roster?: LineDto[];
  attendances?: AttendanceLookUpDto[];
  createdAt: string;
  updatedAt?: string;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  leagueName?: string | null;
}


export interface CreateEventDto {
  title?: string | null;
  description?: string | null;
  type: EventType;
  startTime: string | null;     // ISO
  locationName?: string | null;
  locationAddress?: string | null;
  iceRinkNumber?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  leagueName?: string | null;
}