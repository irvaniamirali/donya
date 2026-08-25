use std::path::Path;

use lofty::{
    file::TaggedFileExt,
    probe::Probe,
    tag::Accessor,
};

use super::models::Track;

use super::models::AudioFormat;

pub fn read_metadata(
    path: &Path,
    format: AudioFormat,
) -> Result<Track, String> {
    let tagged_file = Probe::open(path)
        .map_err(|error| {
            format!(
                "Failed to open '{}': {}",
                path.display(),
                error
            )
        })?
        .read()
        .map_err(|error| {
            format!(
                "Failed to read metadata from '{}': {}",
                path.display(),
                error
            )
        })?;

    let properties = tagged_file.properties();

    let tag = tagged_file.primary_tag();

    let title = tag
        .and_then(|tag| tag.title())
        .map(|value| value.to_string())
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| {
            path.file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or("Unknown title")
                .to_string()
        });

    let artist = tag
        .and_then(|tag| tag.artist())
        .map(|value| value.to_string());

    let album = tag
        .and_then(|tag| tag.album())
        .map(|value| value.to_string());

    let album_artist = tag
        .and_then(|tag| tag.get_string(&lofty::tag::ItemKey::AlbumArtist))
        .map(|value| value.to_string());

    let genre = tag
        .and_then(|tag| tag.genre())
        .map(|value| value.to_string());

    let year = tag
        .and_then(|tag| tag.year());

    let track_number = tag
        .and_then(|tag| tag.track());

    let disc_number = tag
        .and_then(|tag| tag.disk());

    let duration_ms = properties.duration().as_millis() as u64;

    Ok(Track {
        id: build_track_id(path),
        path: path.to_string_lossy().into_owned(),

        title,
        artist,
        album,
        album_artist,

        genre,
        year,

        track_number,
        disc_number,

        duration_ms,

        format,

        artwork: None,
    })
}

fn build_track_id(path: &Path) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();

    path.to_string_lossy().hash(&mut hasher);

    format!("{:x}", hasher.finish())
}
