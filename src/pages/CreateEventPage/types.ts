import { EventType } from "src/types/events";

export interface CreateEventPageProps {
  onBack: () => void;
  onCreated: (id: string) => void;
}

export interface EventFormData {
  title: string;
  description: string;
  startTime: string;
  locationName: string;
  locationAddress: string;
  iceRinkNumber: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  useAddressSearch: boolean;
  type: EventType;
}
