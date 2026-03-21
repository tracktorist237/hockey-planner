import { UserRole } from "../constants/roles";

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  jerseyNumber: number | null;
  fullName?: string;
  role: UserRole;
}

export interface ApiUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
  fullName?: string | null;
  role?: number | UserRole;
}
