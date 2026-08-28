import { Pause, Play } from "lucide-react";

import type { ArtistGroup, Track } from "../types/music";

import { Artwork } from "../components/Artwork";
import { BackButton } from "../components/BackButton";
import { SongTable } from "../components/SongTable";

type ArtistsProps = {
  artists: ArtistGroup[];
  allArtists: ArtistGroup[];

  selectedArtistName: string | null;
  onSelectArtist: (name: string | null) => void;

  currentTrack: Track | null;
  playing: boolean;

  onPlayTrack: (track: Track, list: Track[]) => void;
  onTogglePlaying: () => void;

  isFavorite: (trackId: string) => boolean;
  onToggleFavorite: (trackId: string) => void;

  onGoToAlbum: (track: Track) => void;
};

export function Artists({
  artists,
  allArtists,
  selectedArtistName,
  onSelectArtist,
  currentTrack,
  playing,
  onPlayTrack,
  onTogglePlaying,
  isFavorite,
  onToggleFavorite,
  onGoToAlbum,
}: ArtistsProps) {
  const selectedArtist = selectedArtistName
    ? allArtists.find(
        (artist) => artist.name === selectedArtistName,
      ) ?? null
    : null;

  if (selectedArtist) {
    const isArtistPlaying =
      playing &&
      currentTrack != null &&
      selectedArtist.tracks.some(
        (track) => track.id === currentTrack.id,
      );

    return (
      <section className="page-section">
        <BackButton
          label="Back to Artists"
          onClick={() => onSelectArtist(null)}
        />

        <div className="album-detail-header">
          <div className="artist-avatar">
            <Artwork
              artwork={selectedArtist.artwork}
              size="large"
            />
          </div>

          <div className="album-detail-info">
            <span className="eyebrow">ARTIST</span>
            <h1>{selectedArtist.name}</h1>

            <p>
              {selectedArtist.albumCount} albums ·{" "}
              {selectedArtist.trackCount} tracks
            </p>

            <button
              className="hero-play"
              onClick={() => {
                if (isArtistPlaying) {
                  onTogglePlaying();
                } else {
                  onPlayTrack(
                    selectedArtist.tracks[0],
                    selectedArtist.tracks,
                  );
                }
              }}
            >
              {isArtistPlaying ? (
                <Pause size={17} />
              ) : (
                <Play size={17} />
              )}
              {isArtistPlaying ? "Pause" : "Play"}
            </button>
          </div>
        </div>

        <SongTable
          tracks={selectedArtist.tracks}
          currentTrack={currentTrack}
          playing={playing}
          onPlay={(track) =>
            onPlayTrack(track, selectedArtist.tracks)
          }
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onGoToAlbum={onGoToAlbum}
          onGoToArtist={() => {}}
        />
      </section>
    );
  }

  if (artists.length === 0) {
    return (
      <div className="empty-state">
        <strong>No artists found</strong>
        <span>Try another search.</span>
      </div>
    );
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LIBRARY</span>
          <h1>Artists</h1>
          <p>{artists.length} artists</p>
        </div>
      </div>

      <div className="album-grid">
        {artists.map((artist) => (
          <button
            key={artist.name}
            className="album-card"
            onClick={() => onSelectArtist(artist.name)}
          >
            <div className="artist-avatar">
              <Artwork artwork={artist.artwork} size="large" />
            </div>

            <div className="album-info">
              <strong>{artist.name}</strong>
              <span>{artist.trackCount} tracks</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
