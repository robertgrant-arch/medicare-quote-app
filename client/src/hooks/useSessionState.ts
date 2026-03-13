import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useSessionState — useState backed by sessionStorage.
 * Data survives route changes within the same tab/session but is
 * automatically cleared when the browser tab is closed.
 *
 * @param key   sessionStorage key
 * @param fallback  default value when nothing is stored
 */
export function useSessionState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  // Keep a ref so the effect always writes the latest value
  const valueRef = useRef(value);
  valueRef.current = value;

  // Persist to sessionStorage whenever value changes
  useEffect(() => {
    try {
      if (
        valueRef.current === fallback ||
        (Array.isArray(valueRef.current) && (valueRef.current as unknown[]).length === 0)
      ) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(valueRef.current));
      }
    } catch {
      // quota exceeded or private browsing — silently ignore
    }
  }, [value, key, fallback]);

  // Wrapper that mirrors React setState signature
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        return resolved;
      });
    },
    []
  );

  return [value, set] as const;
}

/**
 * Convenience: useSessionState for a Set<string> (serialised as array).
 */
export function useSessionSet(key: string) {
  const [arr, setArr] = useSessionState<string[]>(key, []);

  const asSet = new Set(arr);

  const toggle = useCallback(
    (id: string) =>
      setArr((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      ),
    [setArr]
  );

  const add = useCallback((id: string) => setArr((prev) => prev.includes(id) ? prev : [...prev, id]), [setArr]);
  const remove = useCallback((id: string) => setArr((prev) => prev.filter((x) => x !== id)), [setArr]);
  const clear = useCallback(() => setArr([]), [setArr]);

  return { set: asSet, arr, toggle, add, remove, clear };
}
