import type { TeamContactItem, TeamDto } from "src/types/teams";

type ProfileFields = Pick<
  TeamDto,
  "name" | "description" | "avatarUrl" | "coverImageUrl" | "phones" | "links" | "addresses"
>;

const hasText = (value: string | null | undefined): boolean => Boolean(value?.trim());

const hasCompleteContact = (contacts: TeamContactItem[] | undefined): boolean =>
  contacts?.some((item) => hasText(item.title) && hasText(item.value)) ?? false;

export const getTeamProfileCompletion = (team: ProfileFields) => {
  const steps = [
    { label: "Название", complete: hasText(team.name) },
    { label: "Описание", complete: hasText(team.description) },
    { label: "Аватар", complete: hasText(team.avatarUrl) },
    { label: "Обложка", complete: hasText(team.coverImageUrl) },
    {
      label: "Контакты",
      complete:
        hasCompleteContact(team.phones) ||
        hasCompleteContact(team.links) ||
        hasCompleteContact(team.addresses),
    },
  ];
  return {
    steps,
    completed: steps.filter((step) => step.complete).length,
    total: steps.length,
  };
};

interface TeamProfileCompletionProps {
  team: ProfileFields;
  compact?: boolean;
}

export function TeamProfileCompletion({ team, compact = false }: TeamProfileCompletionProps) {
  const { steps, completed, total } = getTeamProfileCompletion(team);
  return (
    <section
      aria-label="Заполненность профиля команды"
      style={{
        border: "1px solid var(--hp-border)",
        borderRadius: 14,
        padding: 14,
        background: "var(--hp-surface-soft)",
        marginTop: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "var(--hp-text-strong)" }}>
          Заполненность профиля
        </h3>
        <strong style={{ color: "var(--hp-primary)", fontSize: 18, whiteSpace: "nowrap" }}>
          {completed}/{total}
        </strong>
      </div>
      <div
        role="progressbar"
        aria-label="Прогресс заполнения профиля команды"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-valuetext={completed + " из " + total + " полей заполнено"}
        style={{
          marginTop: 10,
          height: 8,
          borderRadius: 999,
          background: "var(--hp-border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: String((completed / total) * 100) + "%",
            borderRadius: 999,
            background: "var(--hp-primary)",
          }}
        />
      </div>
      {!compact && (
        <ul
          aria-label="Поля профиля"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: 0,
            margin: "12px 0 0",
            listStyle: "none",
          }}
        >
          {steps.map((step) => (
            <li
              key={step.label}
              style={{
                padding: "6px 9px",
                borderRadius: 999,
                background: step.complete ? "var(--hp-success-soft)" : "var(--hp-surface)",
                color: step.complete ? "var(--hp-success)" : "var(--hp-muted)",
                border: "1px solid var(--hp-border)",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {step.complete ? "✓ " : "○ "}{step.label}
            </li>
          ))}
        </ul>
      )}
      <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: 1.4, color: "var(--hp-muted)" }}>
        {completed === total
          ? "Все пять разделов профиля заполнены."
          : compact
            ? "Дополнить профиль можно в настройках команды."
            : "Считаются сохранённые данные. Изменения учитываются после сохранения."}
      </p>
    </section>
  );
}
