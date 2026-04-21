import { normalizeRole, UserRole } from "src/constants/roles";

export const canManageEvents = (role: number | string | UserRole | null | undefined): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === UserRole.Coach || normalizedRole === UserRole.Captain || normalizedRole === UserRole.Manager;
};
