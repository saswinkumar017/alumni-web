import { useRef, useState, useEffect, useCallback, useMemo } from "react";

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  enabled?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {},
): [React.RefObject<Element | null>, boolean] {
  const { enabled = true, threshold, rootMargin, root } = options;
  const ref = useRef<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];
    if (entry) setIsIntersecting(entry.isIntersecting);
  }, []);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const observer = new IntersectionObserver(handleIntersection, { threshold, rootMargin, root });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [enabled, threshold, rootMargin, root, handleIntersection]);

  return useMemo(() => [ref, isIntersecting], [isIntersecting]);
}
