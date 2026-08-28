import { Pause, Play } from "lucide-react";

import type { AlbumGroup, Track } from "../types/music";

import { Artwork } from "../components/Artwork";
import { BackButton } from "../components/BackButton";
import { SongTable } from "../components/SongTable";

type AlbumsProps = {
  albums: AlbumGroup[];
  allAlbums: AlbumGroup[];

  selectedAlbumKey: string | null;
  onSelectAlbum: (key: string | null) => void;

  currentTrack: Track | null;
  playing: boolean;

  onPlayTrack: (track: Track, list: Track[]) => void;
  onTogglePlaying: () => void;

  isFavorite: (trackId: string) => boolean;
  onToggleFavorite: (trackId: string) => void;

  onGoToArtist: (artistName: string) => void;
};

export function Albums({
  albums,
  allAlbums,
  selectedAlbumKey,
  onSelectAlbum,
  currentTrack,
  playing,
  onPlayTrack,
  onTogglePlaying,
  isFavorite,
  onToggleFavorite,
  onGoToArtist,
}: AlbumsProps) {
  const selectedAlbum = selectedAlbumKey
    ? allAlbums.find(
        (album) => album.key === selectedAlbumKey,
      ) ?? null
    : null;

  if (selectedAlbum) {
    const isAlbumPlaying =
      playing &&
      currentTrack != null &&
      selectedAlbum.tracks.some(
        (track) => track.id === currentTrack.id,
      );

    return (
      <section className="page-section">
        <BackButton
          label="Back to Albums"
          onClick={() => onSelectAlbum(null)}
        />

        <div className="album-detail-header">
          <Artwork
            artwork={selectedAlbum.artwork}
            size="large"
          />

          <div className="album-detail-info">
            <span className="eyebrow">ALBUM</span>
            <h1>{selectedAlbum.name}</h1>

            <p>
              <button
                className="inline-link"
                onClick={() =>
                  onGoToArtist(selectedAlbum.artist)
                }
              >
                {selectedAlbum.artist}
              </button>
              {" · "}
              {selectedAlbum.tracks.length} tracks
            </p>

            <button
              className="hero-play"
              onClick={() => {
                if (isAlbumPlaying) {
                  onTogglePlaying();
                } else {
                  onPlayTrack(
                    selectedAlbum.tracks[0],
                    selectedAlbum.tracks,
                  );
                }
              }}
            >
              {isAlbumPlaying ? (
                <Pause size={17} />
              ) : (
                <Play size={17} />
              )}
              {isAlbumPlaying ? "Pause" : "Play"}
            </button>
          </div>
        </div>

        <SongTable
          tracks={selectedAlbum.tracks}
          currentTrack={currentTrack}
          playing={playing}
          onPlay={(track) =>
            onPlayTrack(track, selectedAlbum.tracks)
          }
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onGoToAlbum={() => {}}
          onGoToArtist={(track) =>
            onGoToArtist(track.artist ?? "Unknown Artist")
          }
        />
      </section>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="empty-state">
        <strong>No albums found</strong>
        <span>Try another search.</span>
      </div>
    );
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LIBRARY</span>
          <h1>Albums</h1>
          <p>{albums.length} albums</p>
        </div>
      </div>

      <div className="album-grid">
        {albums.map((album) => (
          <button
            key={album.key}
            className="album-card"
            onClick={() => onSelectAlbum(album.key)}
          >
            <Artwork artwork={album.artwork} size="large" />

            <div className="album-info">
              <strong>{album.name}</strong>
              <span>{album.artist}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
