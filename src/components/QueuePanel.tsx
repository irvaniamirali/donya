import { Music2, Play, X } from "lucide-react";

import type {
  PlayerRepeatMode,
  Track,
} from "../types/music";

import { Artwork } from "./Artwork";

type QueuePanelProps = {
  tracks: Track[];
  currentTrack: Track | null;
  playing: boolean;
  repeat: PlayerRepeatMode;
  onPlay: (track: Track) => void;
  onClose: () => void;
};

export function QueuePanel({
  tracks,
  currentTrack,
  playing,
  repeat,
  onPlay,
  onClose,
}: QueuePanelProps) {
  const currentIndex = tracks.findIndex(
    (track) => track.id === currentTrack?.id,
  );

  const upcoming =
    currentIndex === -1
      ? []
      : tracks.slice(currentIndex + 1);

  const wrapped =
    repeat === "all" && currentIndex !== -1
      ? tracks.slice(0, currentIndex)
      : [];

  const nextUp = [...upcoming, ...wrapped];

  return (
    <aside className="queue-panel">
      <div className="queue-header">
        <div>
          <span className="eyebrow">UP NEXT</span>
          <h3>Queue</h3>
        </div>

        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close queue"
        >
          <X size={17} />
        </button>
      </div>

      <div className="queue-list">
        {currentTrack && (
          <>
            <div className="queue-section-label">
              Now Playing
            </div>

            <QueueRow
              track={currentTrack}
              index={
                currentIndex === -1 ? 1 : currentIndex + 1
              }
              isCurrent
              playing={playing}
              onPlay={onPlay}
            />
          </>
        )}

        <div className="queue-section-label">
          Next Up
          {nextUp.length > 0 && (
            <span className="queue-section-count">
              {nextUp.length}
            </span>
          )}
        </div>

        {nextUp.length === 0 ? (
          <div className="queue-empty">
            <Music2 size={15} strokeWidth={1.7} />
            That's the last song in this list.
          </div>
        ) : (
          nextUp.map((track, index) => (
            <QueueRow
              key={track.id}
              track={track}
              index={index + 1}
              isCurrent={false}
              playing={false}
              onPlay={onPlay}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function QueueRow({
  track,
  index,
  isCurrent,
  playing,
  onPlay,
}: {
  track: Track;
  index: number;
  isCurrent: boolean;
  playing: boolean;
  onPlay: (track: Track) => void;
}) {
  return (
    <button
      className={`queue-item ${
        isCurrent ? "current" : ""
      }`}
      onClick={() => onPlay(track)}
    >
      <span className="queue-index">
        <span className="queue-index-number">{index}</span>

        <span className="queue-index-action">
          {isCurrent ? (
            <EqualizerBars playing={playing} />
          ) : (
            <Play size={12} fill="currentColor" />
          )}
        </span>
      </span>

      <span className="queue-artwork">
        <Artwork artwork={track.artwork} size="small" />
      </span>

      <span className="queue-track-info">
        <strong>{track.title}</strong>
        <span>{track.artist ?? "Unknown artist"}</span>
      </span>

      <span className="queue-duration">
        {formatDuration(track.durationMs)}
      </span>
    </button>
  );
}

function EqualizerBars({ playing }: { playing: boolean }) {
  return (
    <span
      className={`equalizer ${playing ? "is-playing" : ""}`}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </span>
  );
}

function formatDuration(durationMs: number) {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}
