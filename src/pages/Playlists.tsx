import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  AudioLines,
  Clock3,
  ListMusic,
  Music2,
  MoreHorizontal,
  Play,
  Plus,
  Shuffle,
  Trash2,
  X,
} from "lucide-react";

import type { Playlist, Track } from "../types/music";
import { Artwork } from "../components/Artwork";

const formatDuration = (durationMs: number) => {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

type PlaylistsPageProps = {
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  tracks: Track[];
  currentTrack: Track | null;
  playing: boolean;
  onSelectPlaylist: (playlistId: string | null) => void;
  onCreatePlaylist: () => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onShufflePlaylist: (playlist: Playlist) => void;
  onEditPlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  onReorderTracks: (playlistId: string, nextTrackIds: string[]) => void;
  onPlayTrackInPlaylist: (track: Track, list: Track[]) => void;
  onAddSongs: (playlist: Playlist) => void;
};

export function PlaylistsPage({
  playlists,
  selectedPlaylistId,
  tracks,
  currentTrack,
  playing,
  onSelectPlaylist,
  onCreatePlaylist,
  onPlayPlaylist,
  onShufflePlaylist,
  onEditPlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  onReorderTracks,
  onPlayTrackInPlaylist,
  onAddSongs,
}: PlaylistsPageProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = () => setMenuOpen(false);
    window.addEventListener("click", handleClick);

    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  const selectedPlaylist = useMemo(
    () =>
      playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  );

  const selectedTracks = useMemo(() => {
    if (!selectedPlaylist) {
      return [] as Track[];
    }

    const map = new Map(tracks.map((track) => [track.id, track]));

    return selectedPlaylist.trackIds
      .map((trackId) => map.get(trackId))
      .filter((track): track is Track => Boolean(track));
  }, [selectedPlaylist, tracks]);

  const handleDropOnTrack = (targetTrackId: string) => {
    if (!selectedPlaylist || !draggingId || draggingId === targetTrackId) {
      return;
    }

    const nextTrackIds = [...selectedPlaylist.trackIds];
    const fromIndex = nextTrackIds.indexOf(draggingId);
    const toIndex = nextTrackIds.indexOf(targetTrackId);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    nextTrackIds.splice(fromIndex, 1);
    nextTrackIds.splice(toIndex, 0, draggingId);

    onReorderTracks(selectedPlaylist.id, nextTrackIds);
    setDraggingId(null);
  };

  if (!selectedPlaylist) {
    return (
      <section className="page-section">
        <div className="page-heading playlist-overview-heading">
          <div>
            <span className="eyebrow">LIBRARY</span>
            <h1>Playlists</h1>
            <p>{playlists.length} saved collections</p>
          </div>

          <button className="primary-button compact" onClick={onCreatePlaylist}>
            <Plus size={15} />
            Create playlist
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="empty-state large">
            <div className="empty-state-icon">
              <ListMusic size={28} strokeWidth={1.5} />
            </div>
            <strong>No playlists yet</strong>
            <span>Build a custom listening queue for your favorite albums and songs.</span>
            <button className="primary-button" onClick={onCreatePlaylist}>
              <Plus size={16} />
              Create playlist
            </button>
          </div>
        ) : (
          <div className="playlist-grid">
            {playlists.map((playlist) => {
              const playlistTracks = playlist.trackIds
                .map((trackId) => tracks.find((track) => track.id === trackId))
                .filter(Boolean) as Track[];

              return (
                <button
                  key={playlist.id}
                  className="playlist-card"
                  onClick={() => onSelectPlaylist(playlist.id)}
                >
                  <div
                    className="playlist-card-cover"
                    style={{ backgroundImage: `url("${playlist.cover || ""}")` }}
                  />
                  <div className="playlist-card-copy">
                    <strong>{playlist.title}</strong>
                    {playlist.caption && <span className="playlist-card-caption">{playlist.caption}</span>}
                    <span className="playlist-card-count">{playlistTracks.length} {playlistTracks.length === 1 ? "track" : "tracks"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  const totalDuration = selectedTracks.reduce(
    (total, track) => total + track.durationMs,
    0,
  );

  return (
    <section className="page-section playlist-page">
      <button className="back-button" onClick={() => onSelectPlaylist(null)}>
        <span className="back-button-icon">
          <ArrowLeft size={14} />
        </span>
        Back to playlists
      </button>

      <header className="playlist-header">
        <div
          className="playlist-header-cover"
          style={{ backgroundImage: `url("${selectedPlaylist.cover}")` }}
        />

        <div className="playlist-header-meta">
          <span className="eyebrow">PLAYLIST</span>
          <h1>{selectedPlaylist.title}</h1>
          {selectedPlaylist.caption && (
            <p className="playlist-caption">{selectedPlaylist.caption}</p>
          )}

          <div className="playlist-metadata">
            <span>{selectedTracks.length} tracks</span>
            <span>•</span>
            <span>{formatDuration(totalDuration)}</span>
          </div>

          <div className="playlist-actions">
            <button className="primary-button compact" onClick={() => onPlayPlaylist(selectedPlaylist)}>
              <Play size={14} />
              Play
            </button>

            <button className="filter-button" onClick={() => onShufflePlaylist(selectedPlaylist)}>
              <Shuffle size={14} />
              Shuffle
            </button>

            <div className="playlist-menu-wrapper">
              <button
                className="icon-button playlist-more-button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen((current) => !current);
                }}
                aria-label="Playlist actions"
                aria-expanded={menuOpen}
                title="Playlist actions"
              >
                <MoreHorizontal size={17} />
              </button>

              {menuOpen && (
                <div className="context-menu playlist-context-menu" onClick={(event) => event.stopPropagation()}>
                  <button onClick={() => { onEditPlaylist(selectedPlaylist); setMenuOpen(false); }}>
                    Edit playlist
                  </button>
                  <button className="context-menu-danger" onClick={() => { onDeletePlaylist(selectedPlaylist.id); setMenuOpen(false); }}>
                    <Trash2 size={14} />
                    Delete playlist
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="playlist-tools">
        <span className="playlist-list-label">{selectedTracks.length ? "Tracks in this playlist" : "Playlist contents"}</span>
        <div className="playlist-tools-actions">
          <button className="text-button playlist-new-button" onClick={() => onAddSongs(selectedPlaylist)}>
            <Music2 size={14} />
            Add songs
          </button>
          <button className="text-button playlist-new-button" onClick={onCreatePlaylist}>
            <Plus size={14} />
            New playlist
          </button>
        </div>
      </div>

      <div className="playlist-table-wrap">
        {selectedTracks.length === 0 ? (
          <div className="empty-state large">
            <div className="empty-state-icon">
              <Music2 size={28} strokeWidth={1.5} />
            </div>
            <strong>This playlist is empty</strong>
            <span>Add songs from your library to start building the queue.</span>
            <button className="primary-button" onClick={() => onAddSongs(selectedPlaylist)}>
              <Music2 size={15} />
              Browse songs
            </button>
          </div>
        ) : (
          <div className="playlist-table">
            <div className="table-header">
              <span>#</span>
              <span>Title</span>
              <span>Album</span>
              <span>Duration</span>
              <span />
            </div>

            {selectedTracks.map((track, index) => (
              <div
                key={track.id}
                className={`song-row ${currentTrack?.id === track.id ? "current-song" : ""}`}
                draggable
                onDragStart={() => setDraggingId(track.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDropOnTrack(track.id)}
              >
                <button
                  className="row-number"
                  onClick={() => onPlayTrackInPlaylist(track, selectedTracks)}
                  aria-label={`Play ${track.title}`}
                >
                  {currentTrack?.id === track.id && playing ? <AudioLines size={14} /> : index + 1}
                </button>

                <button className="song-main" onClick={() => onPlayTrackInPlaylist(track, selectedTracks)}>
                  <Artwork artwork={track.artwork} size="small" />
                  <div className="song-title">
                    <strong>{track.title}</strong>
                    <span>{track.artist ?? "Unknown artist"}</span>
                  </div>
                </button>

                <span className="song-album">{track.album ?? "Unknown album"}</span>
                <span className="song-duration"><Clock3 size={13} />{formatDuration(track.durationMs)}</span>

                <div className="playlist-track-actions">
                  <button
                    className="row-menu"
                    onClick={() => onRemoveTrackFromPlaylist(selectedPlaylist.id, track.id)}
                    aria-label={`Remove ${track.title} from playlist`}
                    title="Remove from playlist"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
