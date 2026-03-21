import { AttendanceLookUpDto } from "src/types/events";
import { PlayerRole } from "src/types/lines";

export interface EventPageProps {
  eventId: string;
  onBack: () => void;
  currentUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    jerseyNumber?: number | null;
  } | null;
}

export interface PlayerDetails {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  primaryPosition?: number | null;
  secondaryPosition?: number | null;
  handedness?: number | null;
  height?: number | null;
  weight?: number | null;
  birthDate?: string | null;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
}

export type Slot = "LW" | "C" | "RW" | "LD" | "RD";

export const slotToRole: Record<Slot, PlayerRole> = {
  LW: PlayerRole.LeftWing,
  C: PlayerRole.Center,
  RW: PlayerRole.RightWing,
  LD: PlayerRole.LeftDefender,
  RD: PlayerRole.RightDefender,
};

export const roleToSlot: Record<PlayerRole, Slot | undefined> = {
  [PlayerRole.LeftWing]: "LW",
  [PlayerRole.Center]: "C",
  [PlayerRole.RightWing]: "RW",
  [PlayerRole.LeftDefender]: "LD",
  [PlayerRole.RightDefender]: "RD",
};

export const emptySlots: Record<Slot, AttendanceLookUpDto | null> = {
  LW: null,
  C: null,
  RW: null,
  LD: null,
  RD: null,
};

export const cloneEmptySlots = (): Record<Slot, AttendanceLookUpDto | null> => ({
  ...emptySlots,
});
