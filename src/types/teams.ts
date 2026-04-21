export enum TeamVisibility {
  Public = 1,
  Private = 2,
}

export interface TeamDto {
  id: string;
  name: string;
  description?: string | null;
  visibility: TeamVisibility;
  inviteCode?: string;
  createdByUserId: string;
  membersCount: number;
}

export interface TeamMemberDto {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
  role: number;
}

export interface CreateTeamRequest {
  name: string;
  description?: string | null;
  visibility: TeamVisibility;
}

export interface JoinTeamByCodeRequest {
  code: string;
}
