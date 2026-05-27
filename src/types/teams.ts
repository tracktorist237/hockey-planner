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
  title: string;
  body: string;
  authorUserId: string;
  authorName: string;
  createdAt: string;
}

export interface CreateTeamNewsRequest {
  title: string;
  body: string;
  sendNotification?: boolean;
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
