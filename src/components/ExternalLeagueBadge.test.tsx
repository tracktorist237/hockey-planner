import { render, screen } from "@testing-library/react";
import { ExternalLeagueBadge, externalLeagueBadgePalette } from "src/components/ExternalLeagueBadge";
import { ExternalLeagueProvider } from "src/types/events";

test("uses a stable bounded palette derived from provider and division", () => {
  const first = externalLeagueBadgePalette(ExternalLeagueProvider.Spbhl, "Любитель 1");
  const repeated = externalLeagueBadgePalette(ExternalLeagueProvider.Spbhl, "Любитель 1");
  const another = externalLeagueBadgePalette(ExternalLeagueProvider.Spbhl, "Любитель 3");

  expect(first).toBe(repeated);
  expect(first).toBeGreaterThanOrEqual(0);
  expect(first).toBeLessThan(6);
  expect(another).not.toBe(first);

  render(<ExternalLeagueBadge provider={ExternalLeagueProvider.Spbhl} division="Любитель 1" />);
  expect(screen.getByText("СПбХЛ · Любитель 1")).toHaveClass(`hp-external-league-badge--${first}`);
});

test("keeps provider text when division is absent", () => {
  render(<ExternalLeagueBadge provider={ExternalLeagueProvider.Spbhl} />);
  expect(screen.getByText("СПбХЛ")).toHaveClass("hp-external-league-badge");
});
