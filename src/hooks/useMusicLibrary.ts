import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

import type { Track } from "../types/music";

const SOURCES_KEY = "donya:sources";
const LEGACY_FOLDER_KEY = "donya:last-folder";

export type MusicSource = {
  path: string;
  trackCount: number;
};

type UseMusicLibraryResult = {
  tracks: Track[];
  sources: MusicSource[];

  loading: boolean;
  scanningPath: string | null;
  error: string | null;

  addSource: () => Promise<void>;
  removeSource: (path: string) => void;
  rescanSource: (path: string) => Promise<void>;
  rescanAll: () => Promise<void>;
};

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function trackBelongsToSource(track: Track, sourcePath: string): boolean {
  const trackPath = normalizePath(track.path);
  const source = normalizePath(sourcePath).replace(/\/+$/, "");

  return trackPath === source || trackPath.startsWith(`${source}/`);
}

function sortTracks(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => {
    const artistOrder = (a.artist ?? "")
      .toLowerCase()
      .localeCompare((b.artist ?? "").toLowerCase());

    if (artistOrder !== 0) return artistOrder;

    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
  });
}

function readStoredSources(): string[] {
  try {
    const raw = window.localStorage.getItem(SOURCES_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (value): value is string => typeof value === "string",
        );
      }
    }

    // Migrate the legacy single-folder key used by earlier versions.
    const legacy = window.localStorage.getItem(LEGACY_FOLDER_KEY);

    if (legacy) {
      return [legacy];
    }
  } catch (error) {
    console.error("[Donya] Failed to read music sources:", error);
  }

  return [];
}

function persistSources(sources: string[]) {
  try {
    window.localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
  } catch (error) {
    console.error("[Donya] Failed to persist music sources:", error);
  }
}

export function useMusicLibrary(): UseMusicLibraryResult {
  const [sourcePaths, setSourcePaths] = useState<string[]>(() =>
    readStoredSources(),
  );

  const [tracks, setTracks] = useState<Track[]>([]);

  const [loading, setLoading] = useState(false);
  const [scanningPath, setScanningPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    persistSources(sourcePaths);
  }, [sourcePaths]);

  const scanOne = useCallback(async (path: string) => {
    setScanningPath(path);

    try {
      return await invoke<Track[]>("scan_music_library", { path });
    } finally {
      setScanningPath(null);
    }
  }, []);

  const rescanAll = useCallback(async () => {
    if (sourcePaths.length === 0) {
      setTracks([]);
      return;
    }

    setLoading(true);
    setError(null);

    const collected: Track[] = [];
    const seen = new Set<string>();
    const failures: string[] = [];

    for (const path of sourcePaths) {
      try {
        const result = await scanOne(path);

        for (const track of result) {
          if (!seen.has(track.id)) {
            seen.add(track.id);
            collected.push(track);
          }
        }
      } catch (scanError) {
        console.error(`[Donya] Failed to scan "${path}":`, scanError);
        failures.push(path);
      }
    }

    setTracks(sortTracks(collected));

    if (failures.length > 0) {
      setError(
        failures.length === 1
          ? `Couldn't scan "${failures[0]}". The folder may have been moved or deleted.`
          : `Couldn't scan ${failures.length} of your music folders. They may have been moved or deleted.`,
      );
    }

    setLoading(false);
  }, [sourcePaths, scanOne]);

  // Scan every known source once, on first mount.
  useEffect(() => {
    void rescanAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSource = useCallback(async () => {
    setError(null);

    let selected: string | null;

    try {
      const result = await open({
        directory: true,
        multiple: false,
        title: "Choose a music folder",
      });

      selected = typeof result === "string" ? result : null;
    } catch (dialogError) {
      console.error("[Donya] Failed to open folder dialog:", dialogError);

      setError(
        dialogError instanceof Error
          ? dialogError.message
          : String(dialogError),
      );

      return;
    }

    if (!selected) return;

    const alreadyAdded = sourcePaths.some(
      (path) => normalizePath(path) === normalizePath(selected!),
    );

    if (alreadyAdded) {
      setError("That folder is already part of your library.");
      return;
    }

    setLoading(true);

    try {
      const result = await scanOne(selected);

      setTracks((current) => {
        const seen = new Set(current.map((track) => track.id));
        const merged = [...current];

        for (const track of result) {
          if (!seen.has(track.id)) {
            seen.add(track.id);
            merged.push(track);
          }
        }

        return sortTracks(merged);
      });

      setSourcePaths((current) => [...current, selected!]);
    } catch (scanError) {
      console.error("[Donya] Failed to scan new folder:", scanError);

      setError(
        scanError instanceof Error ? scanError.message : String(scanError),
      );
    } finally {
      setLoading(false);
    }
  }, [sourcePaths, scanOne]);

  const removeSource = useCallback((path: string) => {
    setSourcePaths((current) => current.filter((entry) => entry !== path));

    setTracks((current) =>
      current.filter((track) => !trackBelongsToSource(track, path)),
    );
  }, []);

  const rescanSource = useCallback(
    async (path: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await scanOne(path);

        setTracks((current) => {
          const remaining = current.filter(
            (track) => !trackBelongsToSource(track, path),
          );

          return sortTracks([...remaining, ...result]);
        });
      } catch (scanError) {
        console.error(`[Donya] Failed to rescan "${path}":`, scanError);

        setError(
          scanError instanceof Error
            ? scanError.message
            : String(scanError),
        );
      } finally {
        setLoading(false);
      }
    },
    [scanOne],
  );

  const sources = useMemo<MusicSource[]>(
    () =>
      sourcePaths.map((path) => ({
        path,
        trackCount: tracks.filter((track) =>
          trackBelongsToSource(track, path),
        ).length,
      })),
    [sourcePaths, tracks],
  );

  return {
    tracks,
    sources,

    loading,
    scanningPath,
    error,

    addSource,
    removeSource,
    rescanSource,
    rescanAll,
  };
}
