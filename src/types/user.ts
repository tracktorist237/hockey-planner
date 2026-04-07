import { UserRole } from "../constants/roles";

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  jerseyNumber: number | null;
  fullName?: string;
  photoUrl?: string | null;
  spbhlPlayerId?: string | null;
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
  role?: number | UserRole;
}
