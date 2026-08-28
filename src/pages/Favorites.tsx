import type { Track } from "../types/music";

import { SongTable } from "../components/SongTable";

type FavoritesProps = {
  tracks: Track[];

  currentTrack: Track | null;
  playing: boolean;

  onPlayTrack: (track: Track) => void;

  isFavorite: (trackId: string) => boolean;
  onToggleFavorite: (trackId: string) => void;

  onGoToAlbum: (track: Track) => void;
  onGoToArtist: (track: Track) => void;
};

export function Favorites({
  tracks,
  currentTrack,
  playing,
  onPlayTrack,
  isFavorite,
  onToggleFavorite,
  onGoToAlbum,
  onGoToArtist,
}: FavoritesProps) {
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">COLLECTION</span>
          <h1>Favorites</h1>
          <p>{tracks.length} liked tracks</p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="empty-state">
          <strong>No favorites yet</strong>
          <span>
            Tap the menu on any track and add it here.
          </span>
        </div>
      ) : (
        <SongTable
          tracks={tracks}
          currentTrack={currentTrack}
          playing={playing}
          onPlay={onPlayTrack}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onGoToAlbum={onGoToAlbum}
          onGoToArtist={onGoToArtist}
        />
      )}
    </section>
  );
}
