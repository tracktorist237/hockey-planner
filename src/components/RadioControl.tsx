import { ReactNode } from "react";
import "src/components/RadioControl.css";

interface RadioControlProps {
  checked: boolean;
  onChange: () => void;
  label: ReactNode;
  name: string;
  disabled?: boolean;
}

export function RadioControl({ checked, onChange, label, name, disabled = false }: RadioControlProps) {
  return (
    <label className={`hp-radio${disabled ? " hp-radio--disabled" : ""}`}>
      <span className="hp-radio__control">
        <input
          type="radio"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="hp-radio__input"
        />
        <span aria-hidden="true" className={`hp-radio__circle${checked ? " hp-radio__circle--checked" : ""}`} />
      </span>
      <span className="hp-radio__label">{label}</span>
    </label>
  );
}
