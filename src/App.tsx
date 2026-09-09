import { useEffect, useMemo, useState } from "react";

import "./App.css";

import type { Page, Playlist, Track } from "./types/music";

import { useMusicLibrary } from "./hooks/useMusicLibrary";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useFavorites } from "./hooks/useFavorites";
import { usePlaylists } from "./hooks/usePlaylists";

import { groupAlbums, groupArtists, getAlbumKey } from "./utils/library";

import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { PlayerBar } from "./components/PlayerBar";
import { QueuePanel } from "./components/QueuePanel";
import { NowPlaying } from "./components/NowPlaying";
import { EmptyLibrary } from "./components/EmptyLibrary";
import { SongTable } from "./components/SongTable";
import { PlaylistDialog } from "./components/PlaylistDialog";
import { AddSongsDialog } from "./components/AddSongsDialog";

import { Home } from "./pages/Home";
import { Albums } from "./pages/Albums";
import { Artists } from "./pages/Artists";
import { Favorites } from "./pages/Favorites";
import { Settings } from "./pages/Settings";
import { PlaylistsPage } from "./pages/Playlists";

function App() {
  const [page, setPage] = useState<Page>("Home");
  const [search, setSearch] = useState("");
  const [queueOpen, setQueueOpen] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [selectedAlbumKey, setSelectedAlbumKey] =
    useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] =
    useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] =
    useState<string | null>(null);
  const [queueContext, setQueueContext] = useState<Track[]>([]);
  const [playlistDialog, setPlaylistDialog] = useState<{
    mode: "create" | "edit";
    playlist: Playlist | null;
  } | null>(null);
  const [playlistPickerTrack, setPlaylistPickerTrack] =
    useState<Track | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "info" | "error">("info");
  const [statusLeaving, setStatusLeaving] = useState(false);
  const [playlistToAddSongs, setPlaylistToAddSongs] =
    useState<Playlist | null>(null);

  useEffect(() => {
    if (!statusMessage) return;

    setStatusLeaving(false);
    const leaveTimeoutId = window.setTimeout(() => setStatusLeaving(true), 3900);
    const removeTimeoutId = window.setTimeout(() => setStatusMessage(null), 4200);

    return () => {
      window.clearTimeout(leaveTimeoutId);
      window.clearTimeout(removeTimeoutId);
    };
  }, [statusMessage]);

  const notify = (
    message: string,
    tone: "success" | "info" | "error" = "info",
  ) => {
    setStatusTone(tone);
    setStatusMessage(message);
  };

  const {
    tracks,
    sources,
    loading,
    scanningPath,
    error,
    addSource,
    removeSource,
    rescanSource,
    rescanAll,
  } = useMusicLibrary();

  const { favorites, isFavorite, toggleFavorite, clearFavorites } =
    useFavorites();

  const player = useAudioPlayer({ tracks });

  const {
    playlists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderTracks,
  } = usePlaylists();

  const filteredTracks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return tracks;

    return tracks.filter((track) =>
      [
        track.title,
        track.artist,
        track.album,
        track.albumArtist,
        track.genre,
      ]
        .filter(Boolean)
        .some((value) =>
          value!.toLowerCase().includes(query),
        ),
    );
  }, [tracks, search]);

  const albums = useMemo(() => groupAlbums(tracks), [tracks]);
  const artists = useMemo(() => groupArtists(tracks), [tracks]);

  const filteredAlbums = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return albums;

    return albums.filter(
      (album) =>
        album.name.toLowerCase().includes(query) ||
        album.artist.toLowerCase().includes(query),
    );
  }, [albums, search]);

  const filteredArtists = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return artists;

    return artists.filter((artist) =>
      artist.name.toLowerCase().includes(query),
    );
  }, [artists, search]);

  const favoriteTracks = useMemo(
    () => tracks.filter((track) => favorites.has(track.id)),
    [tracks, favorites],
  );

  const handlePageChange = (nextPage: Page) => {
    setPage(nextPage);
    setSelectedAlbumKey(null);
    setSelectedArtistName(null);

    if (nextPage !== "Playlists") {
      setSelectedPlaylistId(null);
    }
  };

  const handlePlayFromList = (track: Track, list: Track[]) => {
    setQueueContext(list);
    void player.playTrack(track, list);
  };

  const handleGoToAlbum = (track: Track) => {
    setPage("Albums");
    setSelectedAlbumKey(getAlbumKey(track));
  };

  const handleGoToArtistName = (name: string) => {
    setPage("Artists");
    setSelectedArtistName(name);
  };

  const handleGoToArtist = (track: Track) => {
    handleGoToArtistName(track.artist ?? "Unknown Artist");
  };

  const handleCreatePlaylist = () => {
    setPlaylistDialog({ mode: "create", playlist: null });
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setPlaylistDialog({ mode: "edit", playlist });
  };

  const handlePlaylistSubmit = (values: {
    title: string;
    caption: string;
    cover: string | null;
  }) => {
    if (!playlistDialog) return;

    if (playlistDialog.mode === "create") {
      const nextPlaylist = createPlaylist({
        title: values.title,
        caption: values.caption,
        cover: values.cover,
      });

      setSelectedPlaylistId(nextPlaylist.id);
      setPage("Playlists");
      notify(`Created "${nextPlaylist.title}".`, "success");
    } else if (playlistDialog.playlist) {
      updatePlaylist(playlistDialog.playlist.id, {
        title: values.title,
        caption: values.caption,
        cover: values.cover ?? undefined,
      });

      notify(`Updated "${values.title}".`, "success");
    }

    setPlaylistDialog(null);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    const playlist = playlists.find((item) => item.id === playlistId);

    if (!playlist) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${playlist.title}"? This will not remove any music files from your library.`,
    );

    if (!confirmed) {
      return;
    }

    deletePlaylist(playlistId);
    setSelectedPlaylistId((current) =>
      current === playlistId ? null : current,
    );
    notify(`Deleted "${playlist.title}".`, "success");
  };

  const handlePlayPlaylist = async (playlist: Playlist) => {
    const playlistTracks = tracks.filter((track) =>
      playlist.trackIds.includes(track.id),
    );

    if (playlistTracks.length === 0) {
      notify("This playlist has no available tracks.", "info");
      return;
    }

    setQueueContext(playlistTracks);
    const [firstTrack, ...rest] = playlistTracks;

    if (firstTrack) {
      await player.playTrack(firstTrack, [firstTrack, ...rest]);
    }
  };

  const handleShufflePlaylist = async (playlist: Playlist) => {
    const playlistTracks = tracks.filter((track) =>
      playlist.trackIds.includes(track.id),
    );

    if (playlistTracks.length === 0) {
      notify("This playlist has no available tracks.", "info");
      return;
    }

    const nextQueue = [...playlistTracks];
    const [firstTrack] = nextQueue;

    if (!firstTrack) {
      return;
    }

    if (!player.shuffle) {
      player.toggleShuffle();
    }

    setQueueContext(nextQueue);
    await player.playTrack(firstTrack, nextQueue);
  };

  const handleAddTrackToPlaylist = (track: Track) => {
    if (playlists.length === 0) {
      setPlaylistDialog({ mode: "create", playlist: null });
      notify("Create a playlist to add this track.", "info");
      return;
    }

    setPlaylistPickerTrack(track);
  };

  const handleOpenAddSongs = (playlist: Playlist) => {
    setPlaylistToAddSongs(playlist);
  };

  const handleAddSongs = (trackIds: string[]) => {
    if (!playlistToAddSongs || trackIds.length === 0) return;

    trackIds.forEach((trackId) => {
      addTrackToPlaylist(playlistToAddSongs.id, trackId);
    });

    setPlaylistToAddSongs(null);
    notify(
      `Added ${trackIds.length} ${trackIds.length === 1 ? "song" : "songs"} to "${playlistToAddSongs.title}".`,
      "success",
    );
  };

  const handleChoosePlaylistForTrack = (playlistId: string) => {
    if (!playlistPickerTrack) return;

    const alreadyAdded = addTrackToPlaylist(
      playlistId,
      playlistPickerTrack.id,
    );

    setPlaylistPickerTrack(null);

    if (alreadyAdded) {
      notify("That track is already in the playlist.", "info");
      return;
    }

    notify(`Added "${playlistPickerTrack.title}" to a playlist.`, "success");
  };

  const handleRemoveTrackFromPlaylist = (
    playlistId: string,
    trackId: string,
  ) => {
    removeTrackFromPlaylist(playlistId, trackId);
    notify("Track removed from the playlist.", "success");
  };

  const handlePlayPlaylistTrack = (
    track: Track,
    list: Track[],
  ) => {
    setQueueContext(list);
    void player.playTrack(track, list);
  };

  const liked = player.currentTrack
    ? isFavorite(player.currentTrack.id)
    : false;

  const queueTracks =
    player.queue.length > 0
      ? player.queue
      : queueContext.length > 0
        ? queueContext
        : tracks;

  const showEmptyState =
    tracks.length === 0 && page !== "Settings";

  return (
    <div className="app-shell">
      <Sidebar page={page} onPageChange={handlePageChange} />

      <main className="main">
        <Topbar
          page={page}
          search={search}
          onSearchChange={setSearch}
        />

        {showEmptyState ? (
          <EmptyLibrary
            loading={loading}
            error={error}
            onChooseFolder={addSource}
          />
        ) : (
          <div className="content">
            {page === "Home" && (
              <Home
                tracks={filteredTracks}
                currentTrack={player.currentTrack}
                playing={player.playing}
                onPlayTrack={(track) =>
                  handlePlayFromList(track, filteredTracks)
                }
                onTogglePlaying={player.togglePlaying}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onGoToAlbum={handleGoToAlbum}
                onGoToArtist={handleGoToArtist}
              />
            )}

            {page === "Songs" && (
              <section className="page-section">
                <div className="page-heading">
                  <div>
                    <span className="eyebrow">LIBRARY</span>
                    <h1>Songs</h1>
                    <p>{filteredTracks.length} tracks</p>
                  </div>
                </div>

                <SongTable
                  tracks={filteredTracks}
                  currentTrack={player.currentTrack}
                  playing={player.playing}
                  onPlay={(track) =>
                    handlePlayFromList(track, filteredTracks)
                  }
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onAddTrackToPlaylist={handleAddTrackToPlaylist}
                  onGoToAlbum={handleGoToAlbum}
                  onGoToArtist={handleGoToArtist}
                />
              </section>
            )}

            {page === "Albums" && (
              <Albums
                albums={filteredAlbums}
                allAlbums={albums}
                selectedAlbumKey={selectedAlbumKey}
                onSelectAlbum={setSelectedAlbumKey}
                currentTrack={player.currentTrack}
                playing={player.playing}
                onPlayTrack={handlePlayFromList}
                onTogglePlaying={player.togglePlaying}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onGoToArtist={handleGoToArtistName}
              />
            )}

            {page === "Artists" && (
              <Artists
                artists={filteredArtists}
                allArtists={artists}
                selectedArtistName={selectedArtistName}
                onSelectArtist={setSelectedArtistName}
                currentTrack={player.currentTrack}
                playing={player.playing}
                onPlayTrack={handlePlayFromList}
                onTogglePlaying={player.togglePlaying}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onGoToAlbum={handleGoToAlbum}
              />
            )}

            {page === "Playlists" && (
              <PlaylistsPage
                playlists={playlists}
                selectedPlaylistId={selectedPlaylistId}
                tracks={tracks}
                currentTrack={player.currentTrack}
                playing={player.playing}
                onSelectPlaylist={setSelectedPlaylistId}
                onCreatePlaylist={handleCreatePlaylist}
                onPlayPlaylist={handlePlayPlaylist}
                onShufflePlaylist={handleShufflePlaylist}
                onEditPlaylist={handleEditPlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
                onReorderTracks={reorderTracks}
                onPlayTrackInPlaylist={handlePlayPlaylistTrack}
                onAddSongs={handleOpenAddSongs}
              />
            )}

            {page === "Favorites" && (
              <Favorites
                tracks={favoriteTracks}
                currentTrack={player.currentTrack}
                playing={player.playing}
                onPlayTrack={(track) =>
                  handlePlayFromList(track, favoriteTracks)
                }
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                onGoToAlbum={handleGoToAlbum}
                onGoToArtist={handleGoToArtist}
              />
            )}

            {page === "Settings" && (
              <Settings
                sources={sources}
                loading={loading}
                scanningPath={scanningPath}
                error={error}
                onAddSource={addSource}
                onRemoveSource={removeSource}
                onRescanSource={rescanSource}
                onRescanAll={rescanAll}
                trackCount={tracks.length}
                albumCount={albums.length}
                artistCount={artists.length}
                favoriteCount={favorites.size}
                onClearFavorites={clearFavorites}
              />
            )}
          </div>
        )}
      </main>

      {statusMessage && (
        <div className={`playlist-status toast-${statusTone} ${statusLeaving ? "toast-leaving" : ""}`} role="status" aria-live="polite">
          <span>{statusMessage}</span>
          <button
            className="text-button"
            onClick={() => setStatusMessage(null)}
            aria-label="Dismiss notification"
          >
            Close
          </button>
        </div>
      )}

      {player.currentTrack && (
        <PlayerBar
          currentTrack={player.currentTrack}
          playing={player.playing}
          liked={liked}
          shuffle={player.shuffle}
          repeat={player.repeat}
          muted={player.muted}
          volume={player.volume}
          currentTime={player.currentTime}
          duration={player.duration}
          onTogglePlaying={player.togglePlaying}
          onPrevious={player.previous}
          onNext={player.next}
          onToggleLiked={() =>
            player.currentTrack &&
            toggleFavorite(player.currentTrack.id)
          }
          onToggleShuffle={player.toggleShuffle}
          onToggleRepeat={player.toggleRepeat}
          onToggleMuted={player.toggleMuted}
          onVolumeChange={player.setVolume}
          onSeek={player.seek}
          onQueueToggle={() =>
            setQueueOpen((value) => !value)
          }
          onOpenNowPlaying={() => setNowPlayingOpen(true)}
        />
      )}

      {nowPlayingOpen && player.currentTrack && (
        <NowPlaying
          track={player.currentTrack}
          playing={player.playing}
          liked={liked}
          shuffle={player.shuffle}
          repeat={player.repeat}
          muted={player.muted}
          volume={player.volume}
          currentTime={player.currentTime}
          duration={player.duration}
          queueOpen={queueOpen}
          onClose={() => setNowPlayingOpen(false)}
          onTogglePlaying={player.togglePlaying}
          onPrevious={player.previous}
          onNext={player.next}
          onToggleLiked={() =>
            player.currentTrack &&
            toggleFavorite(player.currentTrack.id)
          }
          onToggleShuffle={player.toggleShuffle}
          onToggleRepeat={player.toggleRepeat}
          onToggleMuted={player.toggleMuted}
          onVolumeChange={player.setVolume}
          onSeek={player.seek}
          onQueueToggle={() =>
            setQueueOpen((value) => !value)
          }
        />
      )}

      {queueOpen && player.currentTrack && (
        <QueuePanel
          tracks={queueTracks}
          currentTrack={player.currentTrack}
          playing={player.playing}
          repeat={player.repeat}
          onPlay={(track) =>
            handlePlayFromList(track, queueTracks)
          }
          onClose={() => setQueueOpen(false)}
        />
      )}

      {playlistDialog && (
        <PlaylistDialog
          open={true}
          mode={playlistDialog.mode}
          initialPlaylist={playlistDialog.playlist}
          onClose={() => setPlaylistDialog(null)}
          onSubmit={handlePlaylistSubmit}
        />
      )}

      {playlistPickerTrack && (
        <div className="modal-backdrop" onClick={() => setPlaylistPickerTrack(null)}>
          <div className="playlist-picker" onClick={(event) => event.stopPropagation()}>
            <div className="playlist-dialog-header">
              <div>
                <span className="eyebrow">PLAYLISTS</span>
                <h2>Add to playlist</h2>
              </div>
            </div>

            <div className="playlist-picker-list">
              {playlists.length === 0 ? (
                <div className="empty-state compact">
                  <strong>No playlists yet</strong>
                  <span>Create one first to organize your music.</span>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    className="playlist-picker-item"
                    onClick={() => handleChoosePlaylistForTrack(playlist.id)}
                  >
                    <div
                      className="playlist-inline-cover"
                      style={{ backgroundImage: `url("${playlist.cover}")` }}
                    />
                    <div className="playlist-inline-copy">
                      <strong>{playlist.title}</strong>
                      <span>{playlist.trackIds.length} tracks</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="playlist-dialog-footer">
              <button className="text-button" onClick={() => setPlaylistPickerTrack(null)}>
                Cancel
              </button>
              <button
                className="primary-button compact"
                onClick={() => {
                  setPlaylistPickerTrack(null);
                  handleCreatePlaylist();
                }}
              >
                Create new playlist
              </button>
            </div>
          </div>
        </div>
      )}

      {playlistToAddSongs && (
        <AddSongsDialog
          open={true}
          playlist={playlistToAddSongs}
          tracks={tracks}
          onClose={() => setPlaylistToAddSongs(null)}
          onAdd={handleAddSongs}
        />
      )}
    </div>
  );
}

export default App;
