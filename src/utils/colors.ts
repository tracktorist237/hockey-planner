import { EventType } from "../types/events";
import { UserRole } from "../constants/roles";

export const getEventTypeColor = (type: EventType): string => {
  switch (type) {
    case EventType.Practice:
      return "#4caf50";
    case EventType.Game:
      return "#2196f3";
    case EventType.Meeting:
      return "#9c27b0";
    default:
      return "#757575";
  }
};

export const getLeagueColor = (leagueName: string): string => {
  const colors = [
    "#d32f2f",
    "#1976d2",
    "#388e3c",
    "#f57c00",
    "#7b1fa2",
    "#c2185b",
    "#00796b",
    "#5d4037",
  ];

  let hash = 0;
  for (let i = 0; i < leagueName.length; i++) {
    hash = (hash << 5) - hash + leagueName.charCodeAt(i);
    hash |= 0;
  }

  return colors[Math.abs(hash) % colors.length];
};

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case UserRole.Coach:
      return "#1e88e5";
    case UserRole.Captain:
      return "#8e24aa";
    case UserRole.Manager:
      return "#ef6c00";
    case UserRole.Player:
    default:
      return "#546e7a";
  }
};
