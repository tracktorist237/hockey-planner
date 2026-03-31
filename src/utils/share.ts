import { EventDto, EventType } from "../types/events";
import { formatRuDateLabel } from "./date";

export const generateShareTitle = (event: EventDto): string => {
  if (event.type === EventType.Game && event.homeTeamName && event.awayTeamName) {
    const leagueSuffix = event.leagueName ? ` • ${event.leagueName}` : "";
    return `${event.homeTeamName} - ${event.awayTeamName}${leagueSuffix}`;
  }

  return event.title || "Событие";
};

export const generateShareDescription = (event: EventDto): string => {
  const parts: string[] = [];
  const addressParts: string[] = [];

  if (event.title) {
    parts.push(`🏒 ${event.title}`);
  }

  if (event.startTime) {
    parts.push(`📅 ${formatRuDateLabel(event.startTime)}`);
  }

  if (event.leagueName) {
    parts.push(`🏆 Лига: ${event.leagueName}`);
  }

  if (event.locationName) {
    addressParts.push(event.locationName);
  }

  if (event.locationAddress) {
    addressParts.push(event.locationAddress);
  }

  if (addressParts.length > 0) {
    parts.push(`📍 ${addressParts.join(", ")}`);
  }

  if (event.description) {
    parts.push(`📝 ${event.description}`);
  }

  return parts.join(" • ");
};

export const updateMetaTags = (event: EventDto): void => {
  const title = generateShareTitle(event);
  const description = generateShareDescription(event);
  const url = `${window.location.origin}/events/${event.id}`;

  document.title = title;

  const tags: Record<string, string> = {
    "og:title": title,
    "og:description": description,
    "og:url": url,
    "og:type": "website",
    "twitter:card": "summary",
    "twitter:title": title,
    "twitter:description": description,
  };

  Object.entries(tags).forEach(([property, content]) => {
    let meta =
      document.querySelector(`meta[property='${property}']`) ||
      document.querySelector(`meta[name='${property}']`);

    if (!meta) {
      meta = document.createElement("meta");
      if (property.startsWith("og:")) {
        meta.setAttribute("property", property);
      } else {
        meta.setAttribute("name", property);
      }
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", content);
  });
};
