export interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  jerseyNumber?: number | null;
  fullName?: string | null;
  role?: number; // 1: Coach, 2: Captain, 3: Player, 4: Manager
}