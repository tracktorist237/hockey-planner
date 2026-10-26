import { render, screen, within } from "@testing-library/react";
import { getTeamProfileCompletion, TeamProfileCompletion } from "src/pages/TeamDetailsPage/TeamProfileCompletion";
import { TeamDto, TeamVisibility } from "src/types/teams";

const profile = (values: Partial<TeamDto> = {}): TeamDto => ({
  id: "team-1",
  name: "ХК Пример",
  description: null,
  avatarUrl: null,
  coverImageUrl: null,
  phones: [],
  links: [],
  addresses: [],
  visibility: TeamVisibility.Public,
  createdByUserId: "owner",
  membersCount: 1,
  ...values,
});

test("new team shows 1/5 and missing profile sections", () => {
  render(<TeamProfileCompletion team={profile()} />);
  const section = screen.getByRole("region", { name: "Заполненность профиля команды" });
  expect(within(section).getByText("1/5")).toBeInTheDocument();
  const progress = within(section).getByRole("progressbar", { name: "Прогресс заполнения профиля команды" });
  expect(progress).toHaveAttribute("aria-valuemin", "0");
  expect(progress).toHaveAttribute("aria-valuemax", "5");
  expect(progress).toHaveAttribute("aria-valuenow", "1");
  expect(within(section).getByText("✓ Название")).toBeInTheDocument();
  expect(within(section).getByText("○ Описание")).toBeInTheDocument();
  expect(within(section).getByText("○ Контакты")).toBeInTheDocument();
  expect(within(section).getByText(/Считаются сохранённые данные/)).toBeInTheDocument();
});

test("all five meaningful saved fields produce 5/5", () => {
  const team = profile({
    description: "Любительская команда",
    avatarUrl: "/media/logo.jpg",
    coverImageUrl: "/media/cover.jpg",
    links: [{ title: "Группа VK", value: "https://vk.com/example" }],
  });
  const result = getTeamProfileCompletion(team);
  expect(result).toMatchObject({ completed: 5, total: 5 });
  expect(result.steps.every((step) => step.complete)).toBe(true);
  render(<TeamProfileCompletion team={team} />);
  expect(screen.getByText("5/5")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "5");
  expect(screen.getByText("Все пять разделов профиля заполнены.")).toBeInTheDocument();
});

test("whitespace-only fields and incomplete contacts do not count", () => {
  const result = getTeamProfileCompletion(profile({
    name: "   ",
    description: "   ",
    avatarUrl: "\t",
    coverImageUrl: "\n",
    phones: [{ title: "Капитан", value: "   " }],
    links: [{ title: " ", value: "https://vk.com/example" }],
    addresses: [{ title: "", value: "Санкт-Петербург" }],
  }));
  expect(result.completed).toBe(0);
  expect(result.total).toBe(5);
  expect(result.steps.every((step) => !step.complete)).toBe(true);
});

test.each(["phones", "links", "addresses"] as const)(
  "complete %s contact satisfies the contact section",
  (kind) => {
    const result = getTeamProfileCompletion(profile({
      [kind]: [{ title: " Контакт ", value: " Значение " }],
    }));
    expect(result.completed).toBe(2);
    expect(result.steps.find((step) => step.label === "Контакты")?.complete).toBe(true);
  },
);

test("saved team updates refresh compact progress without stale state", () => {
  const { rerender } = render(<TeamProfileCompletion team={profile()} compact />);
  const section = screen.getByRole("region", { name: "Заполненность профиля команды" });
  expect(within(section).getByText("1/5")).toBeInTheDocument();
  expect(within(section).queryByRole("list")).not.toBeInTheDocument();
  rerender(<TeamProfileCompletion team={profile({ description: "Наша команда" })} compact />);
  expect(within(section).getByText("2/5")).toBeInTheDocument();
  expect(within(section).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
});
