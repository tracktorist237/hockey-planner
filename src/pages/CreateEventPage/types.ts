import { EventType } from "src/types/events";

export interface CreateEventPageProps {
  onBack: () => void;
  onCreated: (id: string) => void;
  currentTeamId?: string | null;
}

export interface EventFormData {
  title: string;
  description: string;
  startTime: string;
  durationMinutes: number;
  locationName: string;
  locationAddress: string;
  iceRinkNumber: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  uniformColorId: string;
  selectedExerciseIds: string[];
  useAddressSearch: boolean;
  type: EventType;
}
