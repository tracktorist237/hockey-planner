export interface CreateUpdatePlayerData {
  userId: string;
  role: PlayerRole;
}

export interface CreateUpdateLineData {
  name?: string | null;
  order: number;
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
