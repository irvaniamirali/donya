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

  playTrack: (track: Track) => Promise<void>;
  togglePlaying: () => Promise<void>;

  next: () => Promise<void>;
  previous: () => Promise<void>;

  seek: (time: number) => void;

  setVolume: (volume: number) => void;
  toggleMuted: () => void;

  toggleShuffle: () => void;
  toggleRepeat: () => void;
};

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

  /*
   * Create one HTMLAudioElement for the whole application.
   */
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

  const getAudioUrl = useCallback(
    (track: Track) => {
      /*
       * Tauri 2 asset protocol.
       *
       * Do NOT manually encode the path.
       * convertFileSrc handles the filesystem path.
       */
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
    async (track: Track) => {
      const audio =
        audioRef.current;

      if (!audio) {
        return;
      }

      const source =
        getAudioUrl(track);

      const isSameTrack =
        currentTrack?.id ===
        track.id;

      if (!isSameTrack) {
        audio.pause();

        /*
         * Clear previous source first.
         */
        audio.removeAttribute("src");

        audio.load();

        setCurrentTrack(track);
        setCurrentTime(0);
        setDuration(0);

        /*
         * Set new Tauri asset URL.
         */
        audio.src = source;

        /*
         * Start loading the new audio.
         */
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
        tracks.length === 0
      ) {
        return -1;
      }

      const currentIndex =
        tracks.findIndex(
          (track) =>
            track.id ===
            currentTrack.id,
        );

      if (currentIndex === -1) {
        return 0;
      }

      if (
        shuffle &&
        tracks.length > 1
      ) {
        const candidates =
          tracks
            .map(
              (_, index) =>
                index,
            )
            .filter(
              (index) =>
                index !==
                currentIndex,
            );

        return candidates[
          Math.floor(
            Math.random() *
              candidates.length,
          )
        ];
      }

      const nextIndex =
        currentIndex + 1;

      if (
        nextIndex >=
          tracks.length &&
        repeat !== "all"
      ) {
        return -1;
      }

      return (
        nextIndex %
        tracks.length
      );
    }, [
      currentTrack,
      repeat,
      shuffle,
      tracks,
    ]);

  const next =
    useCallback(async () => {
      const index =
        getNextIndex();

      if (index === -1) {
        return;
      }

      const track =
        tracks[index];

      if (track) {
        await playTrack(track);
      }
    }, [
      getNextIndex,
      playTrack,
      tracks,
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

      const currentIndex =
        tracks.findIndex(
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
          tracks.length
        ) % tracks.length;

      const previousTrack =
        tracks[previousIndex];

      if (previousTrack) {
        await playTrack(
          previousTrack,
        );
      }
    }, [
      currentTrack,
      playTrack,
      tracks,
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
      setShuffle(
        (value) => !value,
      );
    }, []);

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

  /*
   * One single ended handler.
   */
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
