import {
  Pause,
  Play,
} from "lucide-react";

import type { Track } from "../types/music";

import { SongTable } from "../components/SongTable";

type HomeProps = {
  tracks: Track[];

  currentTrack: Track | null;
  playing: boolean;

  onPlayTrack: (
    track: Track,
  ) => void;

  onTogglePlaying: () => void;
};

export function Home({
  tracks,
  currentTrack,
  playing,
  onPlayTrack,
  onTogglePlaying,
}: HomeProps) {
  const recentlyAdded = tracks;

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">
            YOUR LIBRARY
          </span>

          <h1>
            Good evening.
          </h1>

          <p>
            Your local music,
            organized your way.
          </p>
        </div>

        {currentTrack && (
          <button
            className="hero-play"
            onClick={onTogglePlaying}
          >
            {playing ? (
              <Pause size={17} />
            ) : (
              <Play size={17} />
            )}

            {playing
              ? "Pause"
              : "Play"}
          </button>
        )}
      </section>

      <section className="content-section">
        <div className="section-title-row">
          <div>
            <h2>
              Recently added
            </h2>

            <p>
              Music in your local
              library
            </p>
          </div>

          <span className="text-button">
            {tracks.length} tracks
          </span>
        </div>

        <SongTable
          tracks={recentlyAdded}
          currentTrack={currentTrack}
          playing={playing}
          onPlay={onPlayTrack}
        />
      </section>
    </>
  );
}
