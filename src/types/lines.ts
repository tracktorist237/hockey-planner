export interface CreateUpdatePlayerData {
  userId: string;
  role: PlayerRole;
  isGuest?: boolean;
}

export interface CreateUpdateLineData {
  name?: string | null;
  order: number;
  uniformColorId?: string | null;
  players?: CreateUpdatePlayerData[] | null;
}

export interface CreateUpdateRosterRequest {
  eventId: string;
  lines?: CreateUpdateLineData[] | null;
}

export enum PlayerRole {
  LeftDefender = 2,
  RightDefender = 3,
  Center = 4,
  LeftWing = 5,
  RightWing = 6,
}
