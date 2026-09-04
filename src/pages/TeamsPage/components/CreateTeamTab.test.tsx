import { fireEvent, render, screen } from "@testing-library/react";
import { ExternalLeagueProvider, searchExternalLeagueTeams } from "src/api/externalLeagueTeams";
import { CreateTeamTab } from "src/pages/TeamsPage/components/CreateTeamTab";
import type { SelectedExternalTeam } from "src/pages/TeamsPage/types";

jest.mock("src/api/externalLeagueTeams", () => ({
  ExternalLeagueProvider: { Spbhl: 1 },
  searchExternalLeagueTeams: jest.fn(),
}));

const search = searchExternalLeagueTeams as jest.MockedFunction<typeof searchExternalLeagueTeams>;

test("searches before team creation, selects multiple profiles and chooses primary", async () => {
  const onCreate = jest.fn<void, [SelectedExternalTeam[]]>();
  search.mockResolvedValue([
    { provider: ExternalLeagueProvider.Spbhl, externalTeamId: "one", name: "Северная столица", divisionName: "Любитель 1" },
    { provider: ExternalLeagueProvider.Spbhl, externalTeamId: "two", name: "Северная столица-2", divisionName: "Любитель 3" },
  ]);

  render(<CreateTeamTab name="Моя команда" isPublic loading={false} onNameChange={jest.fn()} onPublicChange={jest.fn()} onCreate={onCreate} />);

  expect(screen.getByRole("combobox", { name: "Лига" })).toHaveValue("1");
  fireEvent.change(screen.getByPlaceholderText("Название команды в лиге"), { target: { value: "Северная столица" } });
  fireEvent.click(screen.getByRole("button", { name: "Найти" }));

  expect(await screen.findByText("Любитель 1")).toBeInTheDocument();
  expect(search).toHaveBeenCalledWith(ExternalLeagueProvider.Spbhl, "Северная столица");
  fireEvent.click(screen.getByRole("checkbox", { name: /Северная столица Любитель 1/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Северная столица-2 Любитель 3/ }));
  const radios = screen.getAllByRole("radio", { name: "Основной профиль" });
  expect(radios[0]).toBeChecked();
  fireEvent.click(radios[1]);
  fireEvent.click(screen.getByRole("button", { name: "Создать команду" }));

  expect(onCreate).toHaveBeenCalledWith([
    { provider: ExternalLeagueProvider.Spbhl, externalTeamId: "one", name: "Северная столица", isPrimary: false },
    { provider: ExternalLeagueProvider.Spbhl, externalTeamId: "two", name: "Северная столица-2", isPrimary: true },
  ]);
});

test("does not overwrite the HockeyPlanner name unless requested", async () => {
  const onNameChange = jest.fn();
  search.mockResolvedValue([{ provider: ExternalLeagueProvider.Spbhl, externalTeamId: "one", name: "Лига-команда" }]);
  render(<CreateTeamTab name="Локальное имя" isPublic loading={false} onNameChange={onNameChange} onPublicChange={jest.fn()} onCreate={jest.fn()} />);

  fireEvent.change(screen.getByPlaceholderText("Название команды в лиге"), { target: { value: "Лига" } });
  fireEvent.click(screen.getByRole("button", { name: "Найти" }));
  fireEvent.click(await screen.findByRole("checkbox", { name: "Лига-команда" }));
  expect(onNameChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Использовать название" }));
  expect(onNameChange).toHaveBeenCalledWith("Лига-команда");
});
