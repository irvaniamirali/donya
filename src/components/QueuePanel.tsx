import {
  AudioLines,
  X,
} from "lucide-react";

import type { Track } from "../types/music";

import { Artwork } from "./Artwork";

type QueuePanelProps = {
  tracks: Track[];
  currentTrack: Track | null;
  playing: boolean;
  onPlay: (track: Track) => void;
  onClose: () => void;
};

export function QueuePanel({
  tracks,
  currentTrack,
  playing,
  onPlay,
  onClose,
}: QueuePanelProps) {
  return (
    <aside className="queue-panel">
      <div className="queue-header">
        <div>
          <span className="eyebrow">
            UP NEXT
          </span>

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
        {tracks.map((track, index) => {
          const isCurrent =
            track.id ===
            currentTrack?.id;

          return (
            <button
              key={track.id}
              className={`queue-item ${
                isCurrent
                  ? "current"
                  : ""
              }`}
              onClick={() =>
                onPlay(track)
              }
            >
              <span className="queue-index">
                {isCurrent && playing ? (
                  <AudioLines size={15} />
                ) : (
                  index + 1
                )}
              </span>

              <Artwork
                artwork={track.artwork}
                size="small"
              />

              <div>
                <strong>
                  {track.title}
                </strong>

                <span>
                  {track.artist ??
                    "Unknown artist"}
                </span>
              </div>

              <span className="queue-duration">
                {formatDuration(
                  track.durationMs,
                )}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function formatDuration(
  durationMs: number,
) {
  const seconds = Math.floor(
    durationMs / 1000,
  );

  const minutes = Math.floor(
    seconds / 60,
  );

  return `${minutes}:${(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}
