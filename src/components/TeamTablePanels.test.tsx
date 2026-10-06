import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TeamTablesPanel } from "./TeamTablesPanel";
import { EventTableProtocolsPanel } from "./EventTableProtocolsPanel";
import * as api from "src/api/teams";

jest.mock("src/api/teams", () => ({
  getTablesFeed: jest.fn(), getTeamTables: jest.fn(), getTeamTable: jest.fn(),
  createTeamTable: jest.fn(), getEventTableProtocols: jest.fn(),
  createEventTableProtocol: jest.fn(), updateEventTableProtocol: jest.fn(),
}));

const summary = { id: "table", teamId: "team", teamName: "Test team", name: "Stats", templateType: 1, canManage: true, createdAt: "2030-01-15T18:00:00Z", rowsCount: 0 };
const table = { ...summary, rows: [] };

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem("currentUser", '{"id":"unrelated-cached-owner"}');
  (api.getTeamTables as jest.Mock).mockResolvedValue([summary]);
  (api.getTablesFeed as jest.Mock).mockResolvedValue([summary]);
  (api.getTeamTable as jest.Mock).mockResolvedValue(table);
  (api.createTeamTable as jest.Mock).mockResolvedValue(table);
  (api.getEventTableProtocols as jest.Mock).mockResolvedValue([]);
  (api.createEventTableProtocol as jest.Mock).mockResolvedValue({ id: "protocol", eventId: "event", teamTableId: "table", rows: [], canManage: true });
});
afterEach(() => localStorage.clear());

test("team table list/detail/create receive only resource IDs and bodies", async () => {
  render(<TeamTablesPanel teamId="team" canManageTeam />);
  await waitFor(() => expect(api.getTeamTable).toHaveBeenCalledWith("team", "table"));
  expect(api.getTeamTables).toHaveBeenCalledWith("team");
  fireEvent.click(screen.getByRole("button", { name: "Создать таблицу" }));
  fireEvent.change(screen.getByRole("textbox", { name: "3. Название" }), { target: { value: "New stats" } });
  fireEvent.click(screen.getByRole("button", { name: "Создать" }));
  await waitFor(() => expect(api.createTeamTable).toHaveBeenCalledWith("team", { name: "New stats", templateType: 1 }));
  await screen.findByText("Таблица создана.");
});

test("feed loads without selected or cached user identity", async () => {
  localStorage.removeItem("currentUser");
  render(<TeamTablesPanel />);
  await waitFor(() => expect(api.getTablesFeed).toHaveBeenCalledWith());
  await waitFor(() => expect(api.getTeamTable).toHaveBeenCalledWith("team", "table"));
});

test("event protocol read and create receive resource IDs without an actor", async () => {
  render(<EventTableProtocolsPanel eventId="event" teamId="team" canManage />);
  await waitFor(() => expect(api.getEventTableProtocols).toHaveBeenCalledWith("event"));
  fireEvent.click(screen.getByRole("button", { name: /Протокол/ }));
  await screen.findByRole("button", { name: "Создать протокол" });
  expect(api.getTeamTables).toHaveBeenCalledWith("team");
  fireEvent.click(screen.getByRole("button", { name: "Создать протокол" }));
  await waitFor(() => expect(api.createEventTableProtocol).toHaveBeenCalledWith("event", { teamTableId: "table" }));
  await screen.findByText("Протокол создан.");
});

test("protocol save uses only event/protocol resources and unchanged row JSON", async () => {
  const protocol = { id: "protocol", eventId: "event", teamTableId: "table", teamTableName: "Stats", createdAt: "2030-01-15T18:00:00Z", canManage: true,
    rows: [{ id: "row", userId: "player", playerName: "Test player", games: 1, goals: 2, assists: 3, points: 5 }] };
  (api.getEventTableProtocols as jest.Mock).mockResolvedValue([protocol]);
  (api.updateEventTableProtocol as jest.Mock).mockResolvedValue({ ...protocol, rows: [{ ...protocol.rows[0], goals: 4, points: 7 }] });
  render(<EventTableProtocolsPanel eventId="event" teamId="team" canManage />);
  await waitFor(() => expect(api.getEventTableProtocols).toHaveBeenCalledWith("event"));
  fireEvent.click(screen.getByRole("button", { name: /Протокол/ }));
  const inputs = await screen.findAllByRole("spinbutton");
  fireEvent.change(inputs[1], { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить протокол" }));
  await waitFor(() => expect(api.updateEventTableProtocol).toHaveBeenCalledWith("event", "protocol", {
    rows: [{ rowId: "row", games: 1, goals: 4, assists: 3 }],
  }));
  await screen.findByText("Протокол сохранен.");
});
