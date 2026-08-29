import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { convertFileSrc } from "@tauri-apps/api/core";

import type {
  PlayerRepeatMode,
  Track,
} from "../types/music";

type UseAudioPlayerOptions = {
  tracks: Track[];
};

type UseAudioPlayerResult = {
  currentTrack: Track | null;
  playing: boolean;

  currentTime: number;
  duration: number;

  volume: number;
  muted: boolean;

  shuffle: boolean;
  repeat: PlayerRepeatMode;

  queue: Track[];

  playTrack: (
    track: Track,
    queue?: Track[],
  ) => Promise<void>;

  togglePlaying: () => Promise<void>;

  next: () => Promise<void>;
  previous: () => Promise<void>;

  seek: (time: number) => void;

  setVolume: (volume: number) => void;
  toggleMuted: () => void;

  toggleShuffle: () => void;
  toggleRepeat: () => void;
};

function shuffleTracks(
  tracks: Track[],
  currentTrackId: string | null,
): Track[] {
  if (tracks.length <= 1) {
    return [...tracks];
  }

  const currentIndex = currentTrackId
    ? tracks.findIndex(
        (track) => track.id === currentTrackId,
      )
    : -1;

  const current =
    currentIndex >= 0
      ? tracks[currentIndex]
      : null;

  const remaining = tracks.filter(
    (track) => track.id !== currentTrackId,
  );

  for (let index = remaining.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1),
    );

    [remaining[index], remaining[randomIndex]] = [
      remaining[randomIndex],
      remaining[index],
    ];
  }

  return current
    ? [current, ...remaining]
    : remaining;
}

export function useAudioPlayer({
  tracks,
}: UseAudioPlayerOptions): UseAudioPlayerResult {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] =
    useState<Track | null>(null);

  const [playing, setPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [volume, setVolumeState] =
    useState(72);

  const [muted, setMuted] =
    useState(false);

  const [shuffle, setShuffle] =
    useState(false);

  const [repeat, setRepeat] =
    useState<PlayerRepeatMode>("off");

  const [queue, setQueue] =
    useState<Track[]>([]);

  useEffect(() => {
    const audio = new Audio();

    audio.preload = "metadata";
    audio.volume = 0.72;

    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      const nextDuration =
        Number.isFinite(audio.duration)
          ? audio.duration
          : 0;

      setDuration(nextDuration);

      console.log(
        "[Donya] loaded metadata",
        {
          duration: nextDuration,
          src: audio.src,
        },
      );
    };

    const handleCanPlay = () => {
      console.log(
        "[Donya] can play:",
        audio.src,
      );
    };

    const handlePlay = () => {
      setPlaying(true);
    };

    const handlePause = () => {
      setPlaying(false);
    };

    const handleError = () => {
      const mediaError =
        audio.error;

      console.error(
        "[Donya] AUDIO ERROR",
        {
          code: mediaError?.code,
          message:
            mediaError?.message,
          src: audio.src,
          networkState:
            audio.networkState,
          readyState:
            audio.readyState,
        },
      );

      setPlaying(false);
    };

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate,
    );

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata,
    );

    audio.addEventListener(
      "canplay",
      handleCanPlay,
    );

    audio.addEventListener(
      "play",
      handlePlay,
    );

    audio.addEventListener(
      "pause",
      handlePause,
    );

    audio.addEventListener(
      "error",
      handleError,
    );

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate,
      );

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata,
      );

      audio.removeEventListener(
        "canplay",
        handleCanPlay,
      );

      audio.removeEventListener(
        "play",
        handlePlay,
      );

      audio.removeEventListener(
        "pause",
        handlePause,
      );

      audio.removeEventListener(
        "error",
        handleError,
      );

      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (currentTrack && queue.length === 0) {
      setQueue(tracks);
      return;
    }

    if (queue.length === 0) {
      return;
    }

    const availableIds = new Set(
      tracks.map((track) => track.id),
    );

    setQueue((current) => {
      const filtered = current.filter((track) =>
        availableIds.has(track.id),
      );

      if (filtered.length === current.length) {
        return current;
      }

      return filtered;
    });
  }, [tracks, currentTrack, queue.length]);

  const getAudioUrl = useCallback(
    (track: Track) => {
      const url = convertFileSrc(
        track.path,
      );

      console.log(
        "[Donya] audio URL:",
        {
          file: track.path,
          url,
          format: track.format,
        },
      );

      return url;
    },
    [],
  );

  const playTrack = useCallback(
    async (
      track: Track,
      nextQueue?: Track[],
    ) => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      const source =
        getAudioUrl(track);

      const isSameTrack =
        currentTrack?.id === track.id;

      if (nextQueue && nextQueue.length > 0) {
        setQueue((currentQueue) => {
          const isSameQueue =
            currentQueue.length ===
              nextQueue.length &&
            currentQueue.every(
              (item, index) =>
                item.id ===
                nextQueue[index]?.id,
            );

          if (isSameQueue) {
            return currentQueue;
          }

          return shuffle
            ? shuffleTracks(
                nextQueue,
                track.id,
              )
            : [...nextQueue];
        });
      } else if (queue.length === 0) {
        setQueue([track]);
      }

      if (!isSameTrack) {
        audio.pause();

        audio.removeAttribute("src");
        audio.load();

        setCurrentTrack(track);
        setCurrentTime(0);
        setDuration(0);

        audio.src = source;
        audio.load();
      }

      try {
        await audio.play();

        setPlaying(true);
      } catch (error) {
        console.error(
          "[Donya] Failed to play:",
          {
            error,
            path: track.path,
            url: source,
            format: track.format,
          },
        );

        setPlaying(false);
      }
    },
    [
      currentTrack?.id,
      getAudioUrl,
      queue.length,
      shuffle,
    ],
  );

  const togglePlaying =
    useCallback(async () => {
      const audio =
        audioRef.current;

      if (!audio || !currentTrack) {
        return;
      }

      if (audio.paused) {
        try {
          await audio.play();
          setPlaying(true);
        } catch (error) {
          console.error(
            "[Donya] Resume failed:",
            error,
          );

          setPlaying(false);
        }
      } else {
        audio.pause();
      }
    }, [currentTrack]);

  const getNextIndex =
    useCallback(() => {
      if (
        !currentTrack ||
        queue.length === 0
      ) {
        return -1;
      }

      const currentIndex =
        queue.findIndex(
          (track) =>
            track.id ===
            currentTrack.id,
        );

      if (currentIndex === -1) {
        return -1;
      }

      const nextIndex =
        currentIndex + 1;

      if (
        nextIndex >= queue.length &&
        repeat !== "all"
      ) {
        return -1;
      }

      return nextIndex % queue.length;
    }, [
      currentTrack,
      queue,
      repeat,
    ]);

  const next =
    useCallback(async () => {
      const index =
        getNextIndex();

      if (index === -1) {
        return;
      }

      const track =
        queue[index];

      if (track) {
        await playTrack(track);
      }
    }, [
      getNextIndex,
      playTrack,
      queue,
    ]);

  const previous =
    useCallback(async () => {
      const audio =
        audioRef.current;

      if (!currentTrack || !audio) {
        return;
      }

      if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }

      if (queue.length === 0) {
        return;
      }

      const currentIndex =
        queue.findIndex(
          (track) =>
            track.id ===
            currentTrack.id,
        );

      if (currentIndex === -1) {
        return;
      }

      const previousIndex =
        (
          currentIndex -
          1 +
          queue.length
        ) % queue.length;

      const previousTrack =
        queue[previousIndex];

      if (previousTrack) {
        await playTrack(
          previousTrack,
        );
      }
    }, [
      currentTrack,
      playTrack,
      queue,
    ]);

  const seek =
    useCallback((time: number) => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      if (
        !Number.isFinite(
          audio.duration,
        )
      ) {
        return;
      }

      const nextTime =
        Math.max(
          0,
          Math.min(
            time,
            audio.duration,
          ),
        );

      audio.currentTime =
        nextTime;

      setCurrentTime(nextTime);
    }, []);

  const setVolume =
    useCallback(
      (nextVolume: number) => {
        const normalized =
          Math.max(
            0,
            Math.min(
              100,
              nextVolume,
            ),
          );

        setVolumeState(
          normalized,
        );

        const audio =
          audioRef.current;

        if (audio) {
          audio.volume =
            normalized / 100;
        }

        if (
          normalized > 0 &&
          muted
        ) {
          setMuted(false);

          if (audio) {
            audio.muted =
              false;
          }
        }
      },
      [muted],
    );

  const toggleMuted =
    useCallback(() => {
      const audio =
        audioRef.current;

      setMuted((value) => {
        const nextValue = !value;

        if (audio) {
          audio.muted =
            nextValue;
        }

        return nextValue;
      });
    }, []);

  const toggleShuffle =
    useCallback(() => {
      setShuffle((enabled) => {
        const nextEnabled = !enabled;

        if (queue.length <= 1) {
          return nextEnabled;
        }

        if (nextEnabled) {
          setQueue(
            shuffleTracks(
              queue,
              currentTrack?.id ?? null,
            ),
          );
        } else {
          const currentId =
            currentTrack?.id;

          const restoredQueue =
            currentId
              ? tracks.filter(
                  (track) =>
                    tracks.some(
                      (item) =>
                        item.id ===
                        track.id,
                    ),
                )
              : [...tracks];

          setQueue(
            currentId
              ? [
                  ...restoredQueue.filter(
                    (track) =>
                      track.id ===
                      currentId,
                  ),
                  ...restoredQueue.filter(
                    (track) =>
                      track.id !==
                      currentId,
                  ),
                ]
              : restoredQueue,
          );
        }

        return nextEnabled;
      });
    }, [
      currentTrack?.id,
      queue,
      tracks,
    ]);

  const toggleRepeat =
    useCallback(() => {
      setRepeat((current) => {
        if (current === "off") {
          return "all";
        }

        if (current === "all") {
          return "one";
        }

        return "off";
      });
    }, []);

  useEffect(() => {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    const handleEnded =
      async () => {
        if (repeat === "one") {
          audio.currentTime = 0;

          try {
            await audio.play();
          } catch (error) {
            console.error(
              "[Donya] Repeat failed:",
              error,
            );

            setPlaying(false);
          }

          return;
        }

        await next();
      };

    audio.addEventListener(
      "ended",
      handleEnded,
    );

    return () => {
      audio.removeEventListener(
        "ended",
        handleEnded,
      );
    };
  }, [next, repeat]);

  return {
    currentTrack,
    playing,

    currentTime,
    duration,

    volume,
    muted,

    shuffle,
    repeat,

    queue,

    playTrack,
    togglePlaying,

    next,
    previous,

    seek,

    setVolume,
    toggleMuted,

    toggleShuffle,
    toggleRepeat,
  };
}
