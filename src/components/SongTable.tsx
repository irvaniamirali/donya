import { useEffect, useState } from "react";

import {
  Album as AlbumIcon,
  AudioLines,
  Clock3,
  Heart,
  MoreHorizontal,
  UserRound,
} from "lucide-react";

import type { Track } from "../types/music";

import { Artwork } from "./Artwork";

type SongTableProps = {
  tracks: Track[];
  currentTrack: Track | null;
  playing: boolean;
  onPlay: (track: Track) => void;

  isFavorite: (trackId: string) => boolean;
  onToggleFavorite: (trackId: string) => void;

  onGoToAlbum: (track: Track) => void;
  onGoToArtist: (track: Track) => void;
};

export function SongTable({
  tracks,
  currentTrack,
  playing,
  onPlay,
  isFavorite,
  onToggleFavorite,
  onGoToAlbum,
  onGoToArtist,
}: SongTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return;

    const handleClick = () => setOpenMenuId(null);

    window.addEventListener("click", handleClick);

    return () =>
      window.removeEventListener("click", handleClick);
  }, [openMenuId]);

  if (tracks.length === 0) {
    return (
      <div className="empty-state">
        <strong>No music found</strong>
        <span>Try another search.</span>
      </div>
    );
  }

  return (
    <div className="song-table">
      <div className="table-header">
        <span>#</span>
        <span>Title</span>
        <span>Album</span>
        <span>Duration</span>
        <span />
      </div>

      {tracks.map((track, index) => {
        const isCurrent = track.id === currentTrack?.id;
        const liked = isFavorite(track.id);

        return (
          <div
            key={track.id}
            className={`song-row ${
              isCurrent ? "current-song" : ""
            }`}
          >
            <button
              className="row-number"
              onClick={() => onPlay(track)}
              aria-label={`Play ${track.title}`}
            >
              {isCurrent && playing ? (
                <AudioLines size={15} />
              ) : (
                index + 1
              )}
            </button>

            <button
              className="song-main"
              onClick={() => onPlay(track)}
            >
              <Artwork artwork={track.artwork} size="small" />

              <div className="song-title">
                <strong>{track.title}</strong>
                <span>
                  {track.artist ?? "Unknown artist"}
                </span>
              </div>
            </button>

            <span className="song-album">
              {track.album ?? "Unknown album"}
            </span>

            <span className="song-duration">
              <Clock3 size={13} />
              {formatDuration(track.durationMs)}
            </span>

            <div className="row-menu-wrapper">
              <button
                className={`row-menu ${
                  liked ? "liked" : ""
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenuId((current) =>
                    current === track.id
                      ? null
                      : track.id,
                  );
                }}
                aria-label="Track menu"
              >
                <MoreHorizontal size={17} />
              </button>

              {openMenuId === track.id && (
                <div
                  className="context-menu"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <button
                    onClick={() => {
                      onToggleFavorite(track.id);
                      setOpenMenuId(null);
                    }}
                  >
                    <Heart
                      size={14}
                      fill={
                        liked
                          ? "currentColor"
                          : "none"
                      }
                    />
                    {liked
                      ? "Remove from Favorites"
                      : "Add to Favorites"}
                  </button>

                  <button
                    onClick={() => {
                      onGoToAlbum(track);
                      setOpenMenuId(null);
                    }}
                  >
                    <AlbumIcon size={14} />
                    Go to Album
                  </button>

                  <button
                    onClick={() => {
                      onGoToArtist(track);
                      setOpenMenuId(null);
                    }}
                  >
                    <UserRound size={14} />
                    Go to Artist
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDuration(durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}
