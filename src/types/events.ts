export interface EventLookUpDto {
  id: string;
  title?: string;
  description?: string;
  type: number;
  startTime: string; // ISO date
  endTime: string;
  status: number;
  locationName?: string;
  locationAddress?: string;
  iceRinkNumber?: string;
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
  endTime: string;
  status: number;
  locationName?: string;
  locationAddress?: string;
  iceRinkNumber?: string;
  roster?: LineDto[];
  attendances?: AttendanceLookUpDto[];
  createdAt: string;
  updatedAt?: string;
  locationFull?: string;
  isPast?: boolean;
  isUpcoming?: boolean;
  isOngoing?: boolean;
}
