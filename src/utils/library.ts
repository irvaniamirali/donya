import type {
  AlbumGroup,
  ArtistGroup,
  Track,
} from "../types/music";

export function getAlbumKey(track: Track): string {
  const albumName = track.album ?? "Unknown Album";
  const albumArtist =
    track.albumArtist ?? track.artist ?? "Unknown Artist";

  return `${albumName}::${albumArtist}`;
}

export function groupAlbums(tracks: Track[]): AlbumGroup[] {
  const map = new Map<string, AlbumGroup>();

  for (const track of tracks) {
    const key = getAlbumKey(track);
    const albumName = track.album ?? "Unknown Album";
    const albumArtist =
      track.albumArtist ?? track.artist ?? "Unknown Artist";

    let group = map.get(key);

    if (!group) {
      group = {
        key: key,
        name: albumName,
        artist: albumArtist,
        artwork: null,
        tracks: [],
      };

      map.set(key, group);
    }

    group.tracks.push(track);

    if (!group.artwork && track.artwork) {
      group.artwork = track.artwork;
    }
  }

  const groups = Array.from(map.values());

  for (const group of groups) {
    group.tracks.sort(function (a, b) {
      const discDiff = (a.discNumber ?? 0) - (b.discNumber ?? 0);

      if (discDiff !== 0) {
        return discDiff;
      }

      const trackDiff =
        (a.trackNumber ?? 0) - (b.trackNumber ?? 0);

      if (trackDiff !== 0) {
        return trackDiff;
      }

      return a.title.localeCompare(b.title);
    });
  }

  groups.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  return groups;
}

type ArtistAccumulator = {
  name: string;
  artwork: string | null;
  albumKeys: Set<string>;
  tracks: Track[];
};

export function groupArtists(tracks: Track[]): ArtistGroup[] {
  const map = new Map<string, ArtistAccumulator>();

  for (const track of tracks) {
    const artistName = track.artist ?? "Unknown Artist";

    let group = map.get(artistName);

    if (!group) {
      group = {
        name: artistName,
        artwork: null,
        albumKeys: new Set<string>(),
        tracks: [],
      };

      map.set(artistName, group);
    }

    group.tracks.push(track);
    group.albumKeys.add(track.album ?? "Unknown Album");

    if (!group.artwork && track.artwork) {
      group.artwork = track.artwork;
    }
  }

  const accumulators = Array.from(map.values());

  const groups: ArtistGroup[] = accumulators.map(function (
    group,
  ) {
    const sortedTracks = group.tracks.slice().sort(function (
      a,
      b,
    ) {
      return a.title.localeCompare(b.title);
    });

    const result: ArtistGroup = {
      name: group.name,
      artwork: group.artwork,
      albumCount: group.albumKeys.size,
      trackCount: group.tracks.length,
      tracks: sortedTracks,
    };

    return result;
  });

  groups.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  return groups;
}
