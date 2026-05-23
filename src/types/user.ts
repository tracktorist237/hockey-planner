import { UserRole } from "../constants/roles";

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  jerseyNumber: number | null;
  fullName?: string;
  photoUrl?: string | null;
  spbhlPlayerId?: string | null;
  primaryPosition?: number | null;
  birthDate?: string | null;
  email?: string | null;
  emailConfirmed?: boolean;
  role: UserRole;
}

export interface ApiUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
  fullName?: string | null;
  photoUrl?: string | null;
  spbhlPlayerId?: string | null;
  primaryPosition?: number | null;
  birthDate?: string | null;
  email?: string | null;
  emailConfirmed?: boolean;
  role?: number | UserRole;
}
