interface AddOptionalSectionButtonProps {
  children: string;
  onClick: () => void;
}

export const AddOptionalSectionButton = ({ children, onClick }: AddOptionalSectionButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: "100%",
      marginBottom: "20px",
      padding: "12px 14px",
      border: "1px dashed var(--hp-primary)",
      borderRadius: "10px",
      backgroundColor: "var(--hp-surface-soft)",
      color: "var(--hp-primary)",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      boxSizing: "border-box",
    }}
  >
    {children}
  </button>
);
