export enum TeamVisibility {
  Public = 1,
  Private = 2,
}

export interface TeamDto {
  id: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  phones?: TeamContactItem[];
  links?: TeamContactItem[];
  addresses?: TeamContactItem[];
  visibility: TeamVisibility;
  inviteCode?: string;
  createdByUserId: string;
  membersCount: number;
  myRole?: number | null;
  myBadgeTitle?: string | null;
}

export interface TeamContactItem {
  title: string;
  value: string;
}

export interface TeamMemberDto {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
  photoUrl?: string | null;
  role: number;
  badgeTitle?: string | null;
}

export interface TeamNewsDto {
  id: string;
  teamId: string;
  teamName?: string | null;
  title: string;
  body: string;
  authorUserId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string | null;
  canManage?: boolean;
}

export interface CreateTeamNewsRequest {
  title: string;
  body: string;
  sendNotification?: boolean;
}

export interface UpdateTeamNewsRequest {
  title: string;
  body: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string | null;
  visibility: TeamVisibility;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  phones?: TeamContactItem[];
  links?: TeamContactItem[];
  addresses?: TeamContactItem[];
}

export interface JoinTeamByCodeRequest {
  code: string;
}

export interface UpdateTeamMemberRequest {
  role?: number | null;
  badgeTitle?: string | null;
}

export interface UpdateTeamRequest {
  name: string;
  description?: string | null;
  visibility: TeamVisibility;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  phones?: TeamContactItem[];
  links?: TeamContactItem[];
  addresses?: TeamContactItem[];
}

export enum TeamTableTemplateType {
  PlayerStats = 1,
}

export interface TeamTableSummaryDto {
  id: string;
  teamId: string;
  teamName: string;
  name: string;
  templateType: TeamTableTemplateType;
  canManage: boolean;
  createdAt: string;
  rowsCount: number;
}

export interface TeamTableDto {
  id: string;
  teamId: string;
  teamName: string;
  name: string;
  templateType: TeamTableTemplateType;
  canManage: boolean;
  createdAt: string;
  rows: TeamTableRowDto[];
}

export interface TeamTableRowDto {
  id: string;
  userId: string;
  playerName: string;
  jerseyNumber?: number | null;
  games: number;
  goals: number;
  assists: number;
  points: number;
}

export interface CreateTeamTableRequest {
  name: string;
  templateType: TeamTableTemplateType;
}

export interface EventTableProtocolDto {
  id: string;
  eventId: string;
  eventTitle: string;
  teamTableId: string;
  teamTableName: string;
  canManage: boolean;
  createdAt: string;
  rows: EventTableProtocolRowDto[];
}

export interface EventTableProtocolRowDto {
  id: string;
  userId: string;
  playerName: string;
  jerseyNumber?: number | null;
  games: number;
  goals: number;
  assists: number;
  points: number;
}

export interface CreateEventTableProtocolRequest {
  teamTableId: string;
}

export interface UpdateEventTableProtocolRowRequest {
  games: number;
  goals: number;
  assists: number;
}

export interface UpdateEventTableProtocolRequest {
  rows: Array<{
    rowId: string;
    games: number;
    goals: number;
    assists: number;
  }>;
}
