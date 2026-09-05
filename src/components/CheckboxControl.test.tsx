import { fireEvent, render, screen } from "@testing-library/react";
import { CheckboxControl } from "src/components/CheckboxControl";

test("keeps native checkbox semantics and toggles from its label", () => {
  const onChange = jest.fn();
  render(<CheckboxControl checked={false} onChange={onChange} label="Выбрать" />);
  const checkbox = screen.getByRole("checkbox", { name: "Выбрать" });
  expect(checkbox).not.toBeChecked();
  expect(document.querySelector(".hp-checkbox__box")).toBeInTheDocument();
  checkbox.focus();
  expect(checkbox).toHaveFocus();
  fireEvent.click(screen.getByText("Выбрать"));
  expect(onChange).toHaveBeenCalledWith(true);
});

test("renders checked and disabled states distinctly", () => {
  const { rerender } = render(<CheckboxControl checked onChange={jest.fn()} label="Флаг" />);
  expect(screen.getByRole("checkbox", { name: "Флаг" })).toBeChecked();
  expect(document.querySelector(".hp-checkbox__box--checked")).toBeInTheDocument();
  rerender(<CheckboxControl checked={false} disabled onChange={jest.fn()} label="Флаг" />);
  expect(screen.getByRole("checkbox", { name: "Флаг" })).toBeDisabled();
  expect(document.querySelector(".hp-checkbox--disabled")).toBeInTheDocument();
});
