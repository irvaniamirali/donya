import {
  useCallback,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "donya:favorites";

function readStoredFavorites(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return new Set();

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }

    return new Set();
  } catch (error) {
    console.error(
      "[Donya] Failed to read favorites:",
      error,
    );

    return new Set();
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(
    () => readStoredFavorites(),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(favorites)),
      );
    } catch (error) {
      console.error(
        "[Donya] Failed to persist favorites:",
        error,
      );
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (trackId: string) => favorites.has(trackId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (trackId: string) => {
      setFavorites((current) => {
        const next = new Set(current);

        if (next.has(trackId)) {
          next.delete(trackId);
        } else {
          next.add(trackId);
        }

        return next;
      });
    },
    [],
  );

  const clearFavorites = useCallback(() => {
    setFavorites(new Set());
  }, []);

  return { favorites, isFavorite, toggleFavorite, clearFavorites };
}
