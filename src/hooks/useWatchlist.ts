import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "trybox:watchlist";

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const isInWatchlist = useCallback((id: string) => ids.includes(id), [ids]);

  const toggleWatchlist = useCallback(
    (id: string) => {
      persist(ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id]);
    },
    [ids, persist],
  );

  return { ids, isInWatchlist, toggleWatchlist };
}
