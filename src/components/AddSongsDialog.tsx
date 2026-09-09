import { useMemo, useState } from "react";

import { Check, Clock3, Search, X } from "lucide-react";

import type { Playlist, Track } from "../types/music";
import { Artwork } from "./Artwork";

type AddSongsDialogProps = {
  playlist: Playlist;
  tracks: Track[];
  open: boolean;
  onClose: () => void;
  onAdd: (trackIds: string[]) => void;
};

const formatDuration = (durationMs: number) => {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function AddSongsDialog({
  playlist,
  tracks,
  open,
  onClose,
  onAdd,
}: AddSongsDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const existingIds = useMemo(
    () => new Set(playlist.trackIds),
    [playlist.trackIds],
  );

  const filteredTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return tracks;
    }

    return tracks.filter((track) =>
      [track.title, track.artist, track.album, track.albumArtist]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, tracks]);

  if (!open) return null;

  const toggleTrack = (trackId: string) => {
    if (existingIds.has(trackId)) return;

    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }

      return next;
    });
  };

  const handleClose = () => {
    setQuery("");
    setSelectedIds(new Set());
    onClose();
  };

  const handleAdd = () => {
    if (selectedIds.size === 0) return;

    onAdd([...selectedIds]);
    setQuery("");
    setSelectedIds(new Set());
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <section
        className="add-songs-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-songs-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="add-songs-header">
          <div>
            <span className="eyebrow">{playlist.title}</span>
            <h2 id="add-songs-title">Add songs</h2>
            <p>Select songs to add to this playlist.</p>
          </div>
          <button className="icon-button subtle" onClick={handleClose} aria-label="Close dialog">
            <X size={15} />
          </button>
        </header>

        <div className="add-songs-toolbar">
          <div className="add-songs-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search songs, artists, or albums"
              aria-label="Search songs"
              autoFocus
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
          <span className="add-songs-summary">
            {selectedIds.size} {selectedIds.size === 1 ? "song" : "songs"} selected
          </span>
        </div>

        <div className="add-songs-list">
          {filteredTracks.length === 0 ? (
            <div className="empty-state compact">
              <strong>{tracks.length === 0 ? "No music in your library" : "No songs found"}</strong>
              <span>{tracks.length === 0 ? "Add a music folder in Settings to browse songs." : "Try a different search."}</span>
            </div>
          ) : (
            filteredTracks.map((track) => {
              const alreadyAdded = existingIds.has(track.id);
              const selected = selectedIds.has(track.id);

              return (
                <button
                  key={track.id}
                  className={`add-song-row ${selected ? "selected" : ""} ${alreadyAdded ? "already-added" : ""}`}
                  onClick={() => toggleTrack(track.id)}
                  disabled={alreadyAdded}
                  aria-pressed={selected}
                >
                  <span className="add-song-check" aria-hidden="true">
                    {selected && <Check size={13} />}
                    {alreadyAdded && <Check size={13} />}
                  </span>
                  <Artwork artwork={track.artwork} size="small" />
                  <span className="add-song-copy">
                    <strong>{track.title}</strong>
                    <span>{track.artist ?? "Unknown artist"}</span>
                  </span>
                  <span className="add-song-album">{track.album ?? "Unknown album"}</span>
                  <span className="add-song-duration"><Clock3 size={12} />{formatDuration(track.durationMs)}</span>
                  {alreadyAdded && <span className="add-song-status">Added</span>}
                </button>
              );
            })
          )}
        </div>

        <footer className="add-songs-footer">
          <span>{selectedIds.size > 0 ? `${selectedIds.size} ready to add` : "Choose one or more songs"}</span>
          <div>
            <button className="text-button" onClick={handleClose}>Cancel</button>
            <button className="primary-button compact" onClick={handleAdd} disabled={selectedIds.size === 0}>
              Add {selectedIds.size || "songs"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
