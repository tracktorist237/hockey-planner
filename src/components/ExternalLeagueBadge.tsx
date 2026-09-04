import { ExternalLeagueProvider } from "src/types/events";
import "src/components/ExternalLeagueBadge.css";

const providerMeta: Record<number, { label: string }> = {
  [ExternalLeagueProvider.Spbhl]: { label: "СПбХЛ" },
};

const paletteSize = 6;

export const externalLeagueBadgePalette = (provider: ExternalLeagueProvider | number, division?: string | null) => {
  const key = `${provider}:${division?.trim().toLocaleLowerCase("ru-RU") ?? ""}`;
  let hash = 0;
  for (const character of key) hash = ((hash * 31) + character.charCodeAt(0)) | 0;
  return Math.abs(hash) % paletteSize;
};

export const externalLeagueProviderLabel = (provider: ExternalLeagueProvider | number) =>
  providerMeta[provider]?.label ?? "Внешняя лига";

export function ExternalLeagueBadge({ provider, division }: { provider: ExternalLeagueProvider | number; division?: string | null }) {
  const meta = providerMeta[provider] ?? { label: "Внешняя лига" };
  const palette = externalLeagueBadgePalette(provider, division);
  return <span data-provider={provider} data-palette={palette} className={`hp-external-league-badge hp-external-league-badge--${palette}`}>{meta.label}{division ? ` · ${division}` : ""}</span>;
}
