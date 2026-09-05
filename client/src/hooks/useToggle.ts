import { useState, useCallback, useMemo } from "react";

export interface UseToggleActions {
  toggle: () => void;
  set: (value: boolean) => void;
  reset: () => void;
}

export function useToggle(initialValue = false): [boolean, UseToggleActions] {
  const [state, setState] = useState(initialValue);

  const toggle = useCallback(() => setState((prev) => !prev), []);
  const set = useCallback((value: boolean) => setState(value), []);
  const reset = useCallback(() => setState(initialValue), [initialValue]);

  const actions = useMemo(() => ({ toggle, set, reset }), [toggle, set, reset]);

  return [state, actions];
}
