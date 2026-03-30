export enum UserRole {
  Coach = "coach",
  Captain = "captain",
  Player = "player",
  Manager = "manager",
}

export const roleToNumber: Record<UserRole, number> = {
  [UserRole.Coach]: 1,
  [UserRole.Captain]: 2,
  [UserRole.Player]: 3,
  [UserRole.Manager]: 4,
};

export const numberToRole: Record<number, UserRole> = {
  1: UserRole.Coach,
  2: UserRole.Captain,
  3: UserRole.Player,
  4: UserRole.Manager,
};

export const roleToLabel: Record<UserRole, string> = {
  [UserRole.Coach]: "Тренер",
  [UserRole.Captain]: "Капитан",
  [UserRole.Player]: "Игрок",
  [UserRole.Manager]: "Менеджер",
};

export const normalizeRole = (role: number | UserRole | null | undefined): UserRole => {
  if (typeof role === "string") {
    return roleToNumber[role as UserRole] ? role : UserRole.Player;
  }

  if (typeof role === "number") {
    return numberToRole[role] ?? UserRole.Player;
  }

  return UserRole.Player;
};
