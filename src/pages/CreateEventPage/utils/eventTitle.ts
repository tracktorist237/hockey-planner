import { EventType } from "src/types/events";

interface EventTitleFields {
  title?: string | null;
  type: EventType;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
}

export const getEditableEventTitle = ({
  title,
  type,
  homeTeamName,
  awayTeamName,
}: EventTitleFields): string => {
  const currentTitle = title?.trim() ?? "";

  if (type === EventType.Practice && currentTitle === "Тренировка") {
    return "";
  }

  if (type === EventType.Game && homeTeamName && awayTeamName) {
    const automaticTitles = [
      `${homeTeamName} - ${awayTeamName}`,
      `${homeTeamName} — ${awayTeamName}`,
    ];

    if (automaticTitles.includes(currentTitle)) {
      return "";
    }
  }

  return currentTitle;
};
