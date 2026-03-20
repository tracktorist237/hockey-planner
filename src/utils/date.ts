const RU_WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] as const;

export const formatRuDateLabel = (dateString: string): string => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const weekday = RU_WEEKDAYS_SHORT[date.getDay()];
  const dayMonth = date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  return `${weekday}, ${dayMonth}`;
};
