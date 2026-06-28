import { useCallback, useEffect, useRef, useState } from 'react';

/** State synced to localStorage. Mirrors the useState API. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  // Keep the latest key in a ref so the persisting effect always writes to it.
  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    try {
      localStorage.setItem(keyRef.current, JSON.stringify(value));
    } catch {
      // Storage may be full or unavailable (private mode); ignore.
    }
  }, [value]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => setValue(next),
    [],
  );

  return [value, set] as const;
}
