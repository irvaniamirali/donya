import {
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

type PlayerBarProps = {
  currentTrack: Track;
  playing: boolean;
  liked: boolean;
  shuffle: boolean;
  repeat: PlayerRepeatMode;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
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
  onOpenNowPlaying: () => void;
};

export function PlayerBar({
  currentTrack,
  playing,
  liked,
  shuffle,
  repeat,
  muted,
  volume,
  currentTime,
  duration,
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
  onOpenNowPlaying,
}: PlayerBarProps) {
  const progress =
    duration > 0 ? (currentTime / duration) * 100 : 0;

  const volumeFill = muted ? 0 : volume;

  return (
    <footer className="player">
      <div className="player-track">
        <button
          className="player-track-info"
          onClick={onOpenNowPlaying}
          aria-label="Open now playing"
        >
          <Artwork
            artwork={currentTrack.artwork}
            color="linear-gradient(135deg, #292929, #666)"
            size="small"
          />

          <div className="now-playing">
            <strong>{currentTrack.title}</strong>
            <span>{currentTrack.artist ?? "Unknown artist"}</span>
          </div>
        </button>

        <button
          className={`player-like ${liked ? "liked" : ""}`}
          onClick={onToggleLiked}
          aria-label="Like track"
        >
          <Heart
            size={16}
            fill={liked ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button
            className={`control-button ${
              shuffle ? "selected" : ""
            }`}
            onClick={onToggleShuffle}
            aria-label="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button
            className="control-button"
            onClick={onPrevious}
            aria-label="Previous track"
          >
            <SkipBack size={18} fill="currentColor" />
          </button>

          <button
            className="play-button"
            onClick={onTogglePlaying}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
          </button>

          <button
            className="control-button"
            onClick={onNext}
            aria-label="Next track"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>

          <button
            className={`control-button ${
              repeat !== "off" ? "selected" : ""
            }`}
            onClick={onToggleRepeat}
            aria-label="Repeat"
          >
            {repeat === "one" ? (
              <Repeat1 size={16} />
            ) : (
              <Repeat2 size={16} />
            )}
          </button>
        </div>

        <div className="progress-row">
          <span>{formatTime(currentTime)}</span>

          <input
            className="progress"
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={(event) =>
              onSeek(Number(event.target.value))
            }
            style={
              {
                "--progress": `${progress}%`,
              } as React.CSSProperties
            }
            aria-label="Track progress"
          />

          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-actions">
        <button
          className="control-button"
          onClick={onQueueToggle}
          aria-label="Queue"
        >
          <ListMusic size={17} />
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
            style={
              {
                "--volume": `${volumeFill}%`,
              } as React.CSSProperties
            }
            aria-label="Volume"
          />
        </div>
      </div>
    </footer>
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
