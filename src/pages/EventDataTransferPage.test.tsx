import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AttendanceTransferMode, getEvent, getEvents, previewEventAttendanceTransfer, transferEventData } from "src/api/events";
import { EventDataTransferPage } from "src/pages/EventDataTransferPage";
import { ExternalLeagueProvider, EventDto, EventType } from "src/types/events";

jest.mock("src/api/events");
jest.mock("src/hooks/useAuth", () => ({ useAuth: () => ({ currentUser: { id: "owner" } }) }));

const source: EventDto = {
  id: "source", title: "Ручной матч", teamId: "team", type: EventType.Game, status: 1,
  startTime: "2026-09-10T16:00:00Z", durationMinutes: 75, createdAt: "2026-09-01T00:00:00Z",
};
const target: EventDto = {
  id: "target", title: "Матч лиги", teamId: "team", type: EventType.Game, status: 1,
  startTime: "2026-09-10T17:00:00Z", durationMinutes: 75, createdAt: "2026-09-01T00:00:00Z",
  externalLeagueProvider: ExternalLeagueProvider.Spbhl, externalDivisionName: "Любитель 3",
  description: "Existing", uniformColorId: "color", roster: [{ id: "line", name: "First", order: 1, members: [] }],
  attendances: [{ userId: "guest", status: 1, respondedAt: "2026-09-01T00:00:00Z", isGuest: true }],
};

const mockedGetEvent = getEvent as jest.MockedFunction<typeof getEvent>;
const mockedGetEvents = getEvents as jest.MockedFunction<typeof getEvents>;
const mockedTransfer = transferEventData as jest.MockedFunction<typeof transferEventData>;
const mockedPreview = previewEventAttendanceTransfer as jest.MockedFunction<typeof previewEventAttendanceTransfer>;

beforeEach(() => {
  mockedGetEvent.mockReset().mockImplementation(id => Promise.resolve(id === source.id ? source : target));
  mockedGetEvents.mockReset().mockResolvedValue({ events: [target, source] });
  mockedTransfer.mockReset().mockResolvedValue({ targetEventId: target.id });
  mockedPreview.mockReset().mockResolvedValue({
    changedCount: 1,
    items: [{
      userId: "guest", userDisplayName: "Иван Иванов", sourceStatus: 2,
      targetStatus: 3, resultingStatus: 2, willChange: true,
    }],
  });
});

test("selects a nearby target, shows conflicts and navigates after transactional transfer", async () => {
  render(<MemoryRouter initialEntries={["/events/source/transfer"]}><Routes>
    <Route path="/events/:id/transfer" element={<EventDataTransferPage />} />
    <Route path="/events/:id" element={<div>Целевое мероприятие открыто</div>} />
  </Routes></MemoryRouter>);

  expect(await screen.findByText("Матч лиги")).toBeInTheDocument();
  expect(screen.getByText("СПбХЛ · Любитель 3")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Выбрать" }));

  expect(await screen.findByText("Текущий состав целевого мероприятия будет заменён.")).toBeInTheDocument();
  expect(screen.getByText("Текущее описание целевого мероприятия будет заменено.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Как объединить ответы участников" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /^Объединить/ })).toBeChecked();
  expect(screen.getByText("Ответы из исходного мероприятия считаются основными и заменяют ответы в целевом. «Не ответил» не перезаписывает уже выбранный ответ.")).toBeInTheDocument();
  expect(screen.getByText("Уже выбранные ответы в целевом мероприятии сохраняются. Из исходного переносятся только ответы вместо «Не ответил» или отсутствующих.")).toBeInTheDocument();
  expect(screen.getByText("Все отметки «Смогу» из исходного мероприятия переносятся в целевое, даже если там было «Не смогу». Остальные ответы не меняются.")).toBeInTheDocument();
  expect(await screen.findByText("Изменится явка 1 участников")).toBeInTheDocument();
  expect(screen.getByText("1: Не смогу → Смогу")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Показать участников"));
  expect(screen.getByText("Иван Иванов: Не смогу → Смогу")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: /^Перенести только «Смогу»/ }));
  await waitFor(() => expect(mockedPreview).toHaveBeenLastCalledWith("source", "target", AttendanceTransferMode.ConfirmedOnly));
  fireEvent.click(screen.getByRole("checkbox", { name: /Состав и звенья/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Гости/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Цвет формы/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Описание мероприятия/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Удалить исходное мероприятие после переноса/ }));
  fireEvent.click(screen.getByRole("button", { name: "Перенести выбранное" }));

  await waitFor(() => expect(mockedTransfer).toHaveBeenCalledWith("source", {
    targetEventId: "target", attendance: true, roster: true, guests: true,
    uniformColor: true, description: true, deleteSourceEvent: true,
    attendanceTransferMode: AttendanceTransferMode.ConfirmedOnly,
  }));
  expect(await screen.findByText("Целевое мероприятие открыто")).toBeInTheDocument();
});
