import { useMemo, useState } from "react";

import "./App.css";

import type { Page, Track } from "./types/music";

import { useMusicLibrary } from "./hooks/useMusicLibrary";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useFavorites } from "./hooks/useFavorites";

import { groupAlbums, groupArtists, getAlbumKey } from "./utils/library";

import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { PlayerBar } from "./components/PlayerBar";
import { QueuePanel } from "./components/QueuePanel";
import { NowPlaying } from "./components/NowPlaying";
import { EmptyLibrary } from "./components/EmptyLibrary";
import { SongTable } from "./components/SongTable";

import { Home } from "./pages/Home";
import { Albums } from "./pages/Albums";
import { Artists } from "./pages/Artists";
import { Favorites } from "./pages/Favorites";
import { Settings } from "./pages/Settings";

function App() {
  const [page, setPage] = useState<Page>("Home");
  const [search, setSearch] = useState("");
  const [queueOpen, setQueueOpen] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);

  const [selectedAlbumKey, setSelectedAlbumKey] =
    useState<string | null>(null);

  const [selectedArtistName, setSelectedArtistName] =
    useState<string | null>(null);

  const [queueContext, setQueueContext] = useState<Track[]>([]);

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

  const artists = useMemo(
    () => groupArtists(tracks),
    [tracks],
  );

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
  };

  const handlePlayFromList = (
    track: Track,
    list: Track[],
  ) => {
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
    </div>
  );
}

export default App;
