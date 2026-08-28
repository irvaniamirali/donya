import { useEffect } from "react";
import type { CSSProperties } from "react";

import {
  ChevronDown,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat1,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";

import type { PlayerRepeatMode, Track } from "../types/music";

import { Artwork } from "./Artwork";

type NowPlayingProps = {
  track: Track;
  playing: boolean;
  liked: boolean;
  shuffle: boolean;
  repeat: PlayerRepeatMode;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  queueOpen: boolean;
  onClose: () => void;
  onTogglePlaying: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleLiked: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleMuted: () => void;
  onVolumeChange: (value: number) => void;
  onSeek: (time: number) => void;
  onQueueToggle: () => void;
};

export function NowPlaying({
  track,
  playing,
  liked,
  shuffle,
  repeat,
  muted,
  volume,
  currentTime,
  duration,
  queueOpen,
  onClose,
  onTogglePlaying,
  onPrevious,
  onNext,
  onToggleLiked,
  onToggleShuffle,
  onToggleRepeat,
  onToggleMuted,
  onVolumeChange,
  onSeek,
  onQueueToggle,
}: NowPlayingProps) {
  // Escape closes the focus view, like most native "now playing" screens.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumeFill = muted ? 0 : volume;

  return (
    <div className="now-playing-view">
      <div
        className="now-playing-backdrop"
        style={{
          backgroundImage: track.artwork
            ? `url("${track.artwork}")`
            : "linear-gradient(135deg, #2b2b2b, #6b6b6b)",
        }}
        aria-hidden="true"
      />

      <div className="now-playing-scrim" aria-hidden="true" />

      <div className="now-playing-content">
        <header className="now-playing-topbar">
          <button
            className="icon-button now-playing-collapse"
            onClick={onClose}
            aria-label="Collapse now playing"
          >
            <ChevronDown size={20} />
          </button>

          <span className="now-playing-kicker">Now Playing</span>

          <button
            className={`icon-button now-playing-queue-toggle ${
              queueOpen ? "active" : ""
            }`}
            onClick={onQueueToggle}
            aria-label="Toggle queue"
          >
            <ListMusic size={18} />
          </button>
        </header>

        <div className="now-playing-body">
          <div className="now-playing-artwork">
            <Artwork artwork={track.artwork} size="large" />
          </div>

          <div className="now-playing-meta">
            <h1>{track.title}</h1>
            <p>
              {track.artist ?? "Unknown artist"}
              {track.album ? ` · ${track.album}` : ""}
            </p>
          </div>

          <div className="now-playing-progress">
            <input
              className="progress"
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(event) => onSeek(Number(event.target.value))}
              style={{ "--progress": `${progress}%` } as CSSProperties}
              aria-label="Track progress"
            />

            <div className="now-playing-times">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="now-playing-controls">
            <button
              className={`control-button ${shuffle ? "selected" : ""}`}
              onClick={onToggleShuffle}
              aria-label="Shuffle"
            >
              <Shuffle size={18} />
            </button>

            <button
              className="control-button large"
              onClick={onPrevious}
              aria-label="Previous track"
            >
              <SkipBack size={22} fill="currentColor" />
            </button>

            <button
              className="play-button large"
              onClick={onTogglePlaying}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause size={26} fill="currentColor" />
              ) : (
                <Play size={26} fill="currentColor" />
              )}
            </button>

            <button
              className="control-button large"
              onClick={onNext}
              aria-label="Next track"
            >
              <SkipForward size={22} fill="currentColor" />
            </button>

            <button
              className={`control-button ${
                repeat !== "off" ? "selected" : ""
              }`}
              onClick={onToggleRepeat}
              aria-label="Repeat"
            >
              {repeat === "one" ? (
                <Repeat1 size={18} />
              ) : (
                <Repeat2 size={18} />
              )}
            </button>
          </div>

          <div className="now-playing-secondary">
            <button
              className={`control-button ${liked ? "selected" : ""}`}
              onClick={onToggleLiked}
              aria-label="Like track"
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
            </button>

            <div className="volume">
              <button
                className="control-button"
                onClick={onToggleMuted}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? (
                  <VolumeX size={17} />
                ) : (
                  <Volume2 size={17} />
                )}
              </button>

              <input
                className="volume-slider"
                type="range"
                min={0}
                max={100}
                value={volumeFill}
                onChange={(event) =>
                  onVolumeChange(Number(event.target.value))
                }
                style={{ "--volume": `${volumeFill}%` } as CSSProperties}
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remaining = totalSeconds % 60;

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}
