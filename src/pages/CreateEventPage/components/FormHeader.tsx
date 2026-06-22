import { InternalPageHeader } from "src/components/InternalPageHeader";

interface FormHeaderProps {
  onBack: () => void;
  isVisible: boolean;
  title?: string;
  onCopyFromEvent?: () => void;
}

export const FormHeader = ({ onBack, isVisible, title = "Новое событие", onCopyFromEvent }: FormHeaderProps) => (
  <InternalPageHeader
    title={title}
    onBack={onBack}
    position="fixed"
    visible={isVisible}
    action={onCopyFromEvent ? (
      <button
        type="button"
        onClick={onCopyFromEvent}
        aria-label="Дополнительные действия"
        title="Дополнительные действия"
        style={{ width: 40, height: 40, padding: 0, border: "1px solid var(--hp-border)", borderRadius: 12, background: "var(--hp-surface-soft)", color: "var(--hp-heading)", fontSize: 20, lineHeight: 1, fontWeight: 900, cursor: "pointer" }}
      >
        ⋮
      </button>
    ) : undefined}
  />
);
