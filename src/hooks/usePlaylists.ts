import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type { Playlist } from "../types/music";

const STORAGE_KEY = "donya:playlists";

export const DEFAULT_PLAYLIST_COVER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#202020" />
      <stop offset="100%" stop-color="#4b4b4b" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" rx="30" fill="url(#g)"/>
  <circle cx="205" cy="235" r="90" fill="rgba(255,255,255,0.15)"/>
  <circle cx="390" cy="302" r="108" fill="rgba(255,255,255,0.08)"/>
  <path d="M236 202c0-20 16-36 36-36h34v136c0 28-22 50-49 50s-49-22-49-50 22-50 49-50c11 0 21 3 29 8v-58h-1Zm50 151c16 0 29 13 29 29s-13 29-29 29-29-13-29-29 13-29 29-29Zm62-120h118v31H348v-31Zm0 67h118v31H348v-31Zm0 67h88v31h-88v-31Z" fill="white" fill-opacity="0.75"/>
</svg>
`)}`;

function dedupeTrackIds(trackIds: string[]): string[] {
  const seen = new Set<string>();

  return trackIds.filter((trackId) => {
    if (!trackId || seen.has(trackId)) {
      return false;
    }

    seen.add(trackId);
    return true;
  });
}

function normalizePlaylist(value: unknown): Playlist | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Playlist>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.caption !== "string" ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.updatedAt !== "string"
  ) {
    return null;
  }

  const trackIds = Array.isArray(candidate.trackIds)
    ? candidate.trackIds.filter(
        (trackId): trackId is string => typeof trackId === "string",
      )
    : [];

  const cover =
    typeof candidate.cover === "string" && candidate.cover.trim()
      ? candidate.cover
      : DEFAULT_PLAYLIST_COVER;

  return {
    id: candidate.id,
    title: candidate.title.trim() || "Untitled playlist",
    caption: candidate.caption.trim(),
    cover,
    trackIds: dedupeTrackIds(trackIds),
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

function readStoredPlaylists(): Playlist[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizePlaylist(item))
      .filter((playlist): playlist is Playlist => playlist !== null);
  } catch (error) {
    console.error("[Donya] Failed to read playlists:", error);
    return [];
  }
}

function persistPlaylists(playlists: Playlist[]) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(playlists),
    );
  } catch (error) {
    console.error("[Donya] Failed to persist playlists:", error);
  }
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>(() =>
    readStoredPlaylists(),
  );

  useEffect(() => {
    persistPlaylists(playlists);
  }, [playlists]);

  const createPlaylist = useCallback(
    (
      input: {
        title: string;
        caption?: string;
        cover?: string | null;
        trackIds?: string[];
      },
    ) => {
      const title = (input.title ?? "").trim();

      if (!title) {
        throw new Error("Playlist name is required.");
      }

      const now = new Date().toISOString();
      const playlist: Playlist = {
        id: `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title,
        caption: (input.caption ?? "").trim(),
        cover:
          input.cover && input.cover.trim()
            ? input.cover
            : DEFAULT_PLAYLIST_COVER,
        trackIds: dedupeTrackIds(input.trackIds ?? []),
        createdAt: now,
        updatedAt: now,
      };

      setPlaylists((current) => [playlist, ...current]);
      return playlist;
    },
    [],
  );

  const updatePlaylist = useCallback(
    (
      playlistId: string,
      changes: Partial<{
        title: string;
        caption: string;
        cover: string | null;
        trackIds: string[];
      }>,
    ) => {
      setPlaylists((current) =>
        current.map((playlist) => {
          if (playlist.id !== playlistId) {
            return playlist;
          }

          const next: Playlist = {
            ...playlist,
            ...changes,
            title:
              changes.title !== undefined
                ? changes.title.trim() || playlist.title
                : playlist.title,
            caption:
              changes.caption !== undefined
                ? changes.caption.trim()
                : playlist.caption,
            cover:
              changes.cover !== undefined
                ? changes.cover && changes.cover.trim()
                  ? changes.cover
                  : DEFAULT_PLAYLIST_COVER
                : playlist.cover || DEFAULT_PLAYLIST_COVER,
            trackIds:
              changes.trackIds !== undefined
                ? dedupeTrackIds(changes.trackIds)
                : playlist.trackIds,
            updatedAt: new Date().toISOString(),
          };

          return next;
        }),
      );
    },
    [],
  );

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((current) =>
      current.filter((playlist) => playlist.id !== playlistId),
    );
  }, []);

  const addTrackToPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      if (!trackId) {
        return false;
      }

      let inserted = false;

      setPlaylists((current) =>
        current.map((playlist) => {
          if (playlist.id !== playlistId) {
            return playlist;
          }

          if (playlist.trackIds.includes(trackId)) {
            inserted = true;
            return playlist;
          }

          inserted = true;
          return {
            ...playlist,
            trackIds: [...playlist.trackIds, trackId],
            updatedAt: new Date().toISOString(),
          };
        }),
      );

      return inserted;
    },
    [],
  );

  const removeTrackFromPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setPlaylists((current) =>
        current.map((playlist) => {
          if (playlist.id !== playlistId) {
            return playlist;
          }

          return {
            ...playlist,
            trackIds: playlist.trackIds.filter(
              (item) => item !== trackId,
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [],
  );

  const reorderTracks = useCallback(
    (playlistId: string, nextTrackIds: string[]) => {
      setPlaylists((current) =>
        current.map((playlist) => {
          if (playlist.id !== playlistId) {
            return playlist;
          }

          return {
            ...playlist,
            trackIds: dedupeTrackIds(nextTrackIds),
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [],
  );

  return {
    playlists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderTracks,
  };
}
