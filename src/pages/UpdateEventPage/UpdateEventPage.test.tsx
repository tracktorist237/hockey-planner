import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UpdateEventPage } from "src/pages/UpdateEventPage/UpdateEventPage";
import { useUpdateEventForm } from "src/pages/UpdateEventPage/hooks/useUpdateEventForm";
import { EventType } from "src/types/events";

jest.mock("src/pages/UpdateEventPage/hooks/useUpdateEventForm", () => ({ useUpdateEventForm: jest.fn() }));
jest.mock("src/hooks/useScrollVisibility", () => ({ useScrollVisibility: () => ({ isHeaderVisible: true, isFooterVisible: true }) }));
jest.mock("src/pages/CreateEventPage/components/UniformColorSection", () => ({ UniformColorSection: () => null }));
jest.mock("src/AddressSearchInput", () => ({
  AddressSearchInput: ({ disabled }: { disabled?: boolean }) => <input aria-label="Адрес площадки" disabled={disabled} />,
}));

const mockedForm = useUpdateEventForm as jest.MockedFunction<typeof useUpdateEventForm>;

test("external match fields remain editable and explain future league updates", () => {
  mockedForm.mockReturnValue({
    formData: {
      title: "Команда A — Команда B",
      description: "",
      startTime: "2026-09-08T20:30",
      durationMinutes: 75,
      locationName: "Арена",
      locationAddress: "Адрес",
      iceRinkNumber: "",
      leagueName: "СПбХЛ",
      homeTeamName: "Команда A",
      awayTeamName: "Команда B",
      uniformColorId: "",
      selectedExerciseIds: [],
      useAddressSearch: true,
      type: EventType.Game,
    },
    updateField: jest.fn(),
    handleTypeChange: jest.fn(),
    loadingInitial: false,
    loading: false,
    error: null,
    isGame: true,
    isMeeting: false,
    isPractice: false,
    teamId: "team",
    isExternalEvent: true,
    handleSubmit: jest.fn(),
  });

  render(<MemoryRouter initialEntries={["/events/event/edit"]}><Routes><Route path="/events/:id/edit" element={<UpdateEventPage />} /></Routes></MemoryRouter>);

  expect(screen.getByText(/При следующем обновлении часть изменений может быть заменена/)).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Например: Д4")).toBeEnabled();
  expect(screen.getByPlaceholderText("Например: Медведи")).toBeEnabled();
  expect(screen.getByPlaceholderText("Например: Волки")).toBeEnabled();
  expect(screen.getByDisplayValue("2026-09-08T20:30")).toBeEnabled();
  expect(screen.getByPlaceholderText("Например: Ледовый дворец 'Арена'")).toBeEnabled();
  expect(screen.getByRole("textbox", { name: "Адрес площадки" })).toBeEnabled();
});
