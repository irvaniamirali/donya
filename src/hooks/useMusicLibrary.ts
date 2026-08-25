import { useCallback, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

import type { Track } from "../types/music";

type UseMusicLibraryResult = {
  tracks: Track[];
  loading: boolean;
  error: string | null;

  chooseMusicFolder: () => Promise<void>;
  scanFolder: (path: string) => Promise<void>;
  clearLibrary: () => void;
};

export function useMusicLibrary(): UseMusicLibraryResult {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanFolder = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await invoke<Track[]>(
        "scan_music_library",
        { path },
      );

      setTracks(result);
    } catch (error) {
      console.error("Failed to scan music library:", error);

      setError(
        error instanceof Error
          ? error.message
          : String(error),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const chooseMusicFolder = useCallback(async () => {
    setError(null);

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Choose your music folder",
      });

      if (typeof selected !== "string") {
        return;
      }

      await scanFolder(selected);
    } catch (error) {
      console.error("Failed to choose music folder:", error);

      setError(
        error instanceof Error
          ? error.message
          : String(error),
      );
    }
  }, [scanFolder]);

  const clearLibrary = useCallback(() => {
    setTracks([]);
    setError(null);
  }, []);

  return {
    tracks,
    loading,
    error,
    chooseMusicFolder,
    scanFolder,
    clearLibrary,
  };
}
