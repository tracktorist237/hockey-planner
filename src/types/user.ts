import { AppRole, UserRole } from "../constants/roles";

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
  phone?: string | null;
  email?: string | null;
  emailConfirmed?: boolean;
  role: UserRole;
  appRole?: AppRole;
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
  phone?: string | null;
  email?: string | null;
  emailConfirmed?: boolean;
  role?: number | UserRole;
  appRole?: number | string | AppRole | null;
}
