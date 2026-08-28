export type Page =
  | "Home"
  | "Songs"
  | "Albums"
  | "Artists"
  | "Favorites"
  | "Settings";

export type AudioFormat =
  | "FLAC"
  | "MP3"
  | "M4A"
  | "AAC"
  | "WAV"
  | "OGG"
  | "OPUS";

export type Track = {
  id: string;
  path: string;

  title: string;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;

  genre: string | null;
  year: number | null;

  trackNumber: number | null;
  discNumber: number | null;

  durationMs: number;

  format: AudioFormat;

  artwork: string | null;
};

export type PlayerRepeatMode =
  | "off"
  | "all"
  | "one";

export type PlayerState = {
  currentTrack: Track | null;
  playing: boolean;

  currentTime: number;
  duration: number;

  volume: number;
  muted: boolean;

  shuffle: boolean;
  repeat: PlayerRepeatMode;
};

export type AlbumGroup = {
  key: string;
  name: string;
  artist: string;
  artwork: string | null;
  tracks: Track[];
};

export type ArtistGroup = {
  name: string;
  artwork: string | null;
  albumCount: number;
  trackCount: number;
  tracks: Track[];
};
