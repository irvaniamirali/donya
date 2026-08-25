import {
  useMemo,
  useState,
} from "react";

import "./App.css";

import type { Page } from "./types/music";

import { useMusicLibrary } from "./hooks/useMusicLibrary";
import { useAudioPlayer } from "./hooks/useAudioPlayer";

import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { PlayerBar } from "./components/PlayerBar";
import { QueuePanel } from "./components/QueuePanel";
import { EmptyLibrary } from "./components/EmptyLibrary";

import { Home } from "./pages/Home";

function App() {
  const [page, setPage] =
    useState<Page>("Home");

  const [search, setSearch] =
    useState("");

  const [queueOpen, setQueueOpen] =
    useState(false);

  const [liked, setLiked] =
    useState(false);

  const {
    tracks,
    loading,
    error,
    chooseMusicFolder,
  } = useMusicLibrary();

  const player = useAudioPlayer({
    tracks,
  });

  const filteredTracks = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return tracks;
    }

    return tracks.filter(
      (track) =>
        [
          track.title,
          track.artist,
          track.album,
          track.albumArtist,
          track.genre,
        ]
          .filter(Boolean)
          .some((value) =>
            value!
              .toLowerCase()
              .includes(query),
          ),
    );
  }, [tracks, search]);

  const handlePageChange = (
    nextPage: Page,
  ) => {
    setPage(nextPage);
  };

  if (tracks.length === 0) {
    return (
      <div className="app-shell">
        <Sidebar
          page={page}
          onPageChange={
            handlePageChange
          }
        />

        <main className="main">
          <Topbar
            page={page}
            search={search}
            onSearchChange={
              setSearch
            }
          />

          <EmptyLibrary
            loading={loading}
            error={error}
            onChooseFolder={
              chooseMusicFolder
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        onPageChange={
          handlePageChange
        }
      />

      <main className="main">
        <Topbar
          page={page}
          search={search}
          onSearchChange={
            setSearch
          }
        />

        <div className="content">
          {page === "Home" && (
            <Home
              tracks={
                filteredTracks
              }
              currentTrack={
                player.currentTrack
              }
              playing={
                player.playing
              }
              onPlayTrack={
                player.playTrack
              }
              onTogglePlaying={
                player.togglePlaying
              }
            />
          )}

          {page === "Songs" && (
            <section className="page-section">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    LIBRARY
                  </span>

                  <h1>Songs</h1>

                  <p>
                    {filteredTracks.length}{" "}
                    tracks
                  </p>
                </div>
              </div>

              <Home
                tracks={
                  filteredTracks
                }
                currentTrack={
                  player.currentTrack
                }
                playing={
                  player.playing
                }
                onPlayTrack={
                  player.playTrack
                }
                onTogglePlaying={
                  player.togglePlaying
                }
              />
            </section>
          )}

          {page !== "Home" &&
            page !== "Songs" && (
              <div className="empty-state">
                <strong>
                  {page}
                </strong>

                <span>
                  This section is
                  coming next.
                </span>
              </div>
            )}
        </div>
      </main>

      {queueOpen &&
        player.currentTrack && (
          <QueuePanel
            tracks={tracks}
            currentTrack={
              player.currentTrack
            }
            playing={
              player.playing
            }
            onPlay={
              player.playTrack
            }
            onClose={() =>
              setQueueOpen(false)
            }
          />
        )}

      {player.currentTrack && (
        <PlayerBar
          currentTrack={
            player.currentTrack
          }
          playing={
            player.playing
          }
          liked={liked}
          shuffle={
            player.shuffle
          }
          repeat={
            player.repeat
          }
          muted={
            player.muted
          }
          volume={
            player.volume
          }
          currentTime={
            player.currentTime
          }
          duration={
            player.duration
          }
          onTogglePlaying={
            player.togglePlaying
          }
          onPrevious={
            player.previous
          }
          onNext={player.next}
          onToggleLiked={() =>
            setLiked(
              (value) => !value,
            )
          }
          onToggleShuffle={
            player.toggleShuffle
          }
          onToggleRepeat={
            player.toggleRepeat
          }
          onToggleMuted={
            player.toggleMuted
          }
          onVolumeChange={
            player.setVolume
          }
          onSeek={player.seek}
          onQueueToggle={() =>
            setQueueOpen(
              (value) => !value,
            )
          }
        />
      )}
    </div>
  );
}

export default App;
