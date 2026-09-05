// Component: CheckboxToggle
// Rendering: Client
// Data: Props-only
// Interaction: Reactive

import type { ChangeEvent } from "react";

export interface CheckboxToggleProps {
  label: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function CheckboxToggle({
  label,
  defaultChecked = true,
  onChange,
}: CheckboxToggleProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange?.(e.target.checked);
  }

  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        onChange={handleChange}
        className="h-4 w-4 rounded border-zinc-300"
      />
      <span className="text-sm text-zinc-700">{label}</span>
    </label>
  );
}
