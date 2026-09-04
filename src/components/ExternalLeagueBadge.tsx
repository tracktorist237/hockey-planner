import { ExternalLeagueProvider } from "src/types/events";

const providerMeta: Record<number, { label: string; background: string; color: string; border: string }> = {
  [ExternalLeagueProvider.Spbhl]: { label: "СПбХЛ", background: "var(--hp-info-soft)", color: "var(--hp-info)", border: "var(--hp-info-border)" },
};

export const externalLeagueProviderLabel = (provider: ExternalLeagueProvider | number) =>
  providerMeta[provider]?.label ?? "Внешняя лига";

export function ExternalLeagueBadge({ provider, division }: { provider: ExternalLeagueProvider | number; division?: string | null }) {
  const meta = providerMeta[provider] ?? { label: "Внешняя лига", background: "var(--hp-surface-soft)", color: "var(--hp-muted)", border: "var(--hp-border)" };
  return <span data-provider={provider} style={{ display: "inline-flex", maxWidth: "100%", width: "fit-content", padding: "3px 8px", borderRadius: 8, border: `1px solid ${meta.border}`, background: meta.background, color: meta.color, fontSize: 12, fontWeight: 800, overflowWrap: "anywhere" }}>{meta.label}{division ? ` · ${division}` : ""}</span>;
}
