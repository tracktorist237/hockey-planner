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
  durationMinutes: number;
  status: number;
  attendanceStatus?: number | null;
  locationName?: string;
  locationAddress?: string;
  iceRinkNumber?: string;
  leagueName?: string | null;
  uniformColorId?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  goalieNeededCount?: number | null;
  goalieConfirmedCount?: number | null;
  goalieApplicationStatus?: number | null;
}

export interface EventListDto {
  events?: EventLookUpDto[];
}

export interface LineDto {
  id: string;
  name?: string;
  order: number;
  uniformColorId?: string | null;
  uniformColor?: UniformColorDto | null;
  members?: PlayerLookUpDto[];
}

export interface PlayerLookUpDto {
  userId: string;
  playerId: string;
  jerseyNumber?: number;
  firstName?: string;
  lastName?: string;
  photoUrl?: string | null;
  role: number;
  handedness?: number | null;
  isGuest?: boolean;
  invitedByUserId?: string | null;
}

export interface AttendanceLookUpDto {
  userId: string;
  jerseyNumber?: number;
  firstName?: string;
  lastName?: string;
  photoUrl?: string | null;
  primaryPosition?: number | null;
  handedness?: number | null;
  status: number;
  respondedAt: string;
  notes?: string;
  isGuest?: boolean;
  invitedByUserId?: string | null;
}

export interface EventDto {
  id: string;
  title?: string;
  description?: string;
  type: number;
  startTime: string;
  durationMinutes: number;
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
  uniformColorId?: string | null;
  uniformColor?: UniformColorDto | null;
  teamId?: string | null;
  teamName?: string | null;
  exercises?: ExerciseDto[];
}


export interface CreateEventDto {
  title?: string | null;
  description?: string | null;
  type: EventType;
  startTime: string | null;     // ISO
  durationMinutes: number;
  locationName?: string | null;
  locationAddress?: string | null;
  iceRinkNumber?: string | null;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  leagueName?: string | null;
  uniformColorId?: string | null;
  teamId?: string | null;
  exerciseIds?: string[];
}

export interface ExerciseDto {
  id: string;
  name: string;
  videoUrl: string;
  teamId?: string | null;
}

export interface UniformColorDto {
  id: string;
  name: string;
  imageUrl: string;
  teamId?: string | null;
}
