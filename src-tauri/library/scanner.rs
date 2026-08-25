use std::path::Path;

use walkdir::WalkDir;

use super::{
    metadata::read_metadata,
    models::{AudioFormat, Track},
};

pub fn scan_directory(
    root: &Path,
) -> Result<Vec<Track>, String> {
    if !root.exists() {
        return Err(format!(
            "Directory does not exist: {}",
            root.display()
        ));
    }

    if !root.is_dir() {
        return Err(format!(
            "Path is not a directory: {}",
            root.display()
        ));
    }

    let mut tracks = Vec::new();

    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(Result::ok)
    {
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        let extension = match path.extension()
            .and_then(|value| value.to_str())
        {
            Some(extension) => extension,
            None => continue,
        };

        let format = match AudioFormat::from_extension(extension) {
            Some(format) => format,
            None => continue,
        };

        match read_metadata(path, format) {
            Ok(track) => {
                tracks.push(track);
            }

            Err(error) => {
                eprintln!("{}", error);
            }
        }
    }

    tracks.sort_by(|a, b| {
        let a_artist = a.artist.as_deref().unwrap_or("");
        let b_artist = b.artist.as_deref().unwrap_or("");

        let artist_order = a_artist
            .to_lowercase()
            .cmp(&b_artist.to_lowercase());

        if artist_order != std::cmp::Ordering::Equal {
            return artist_order;
        }

        a.title
            .to_lowercase()
            .cmp(&b.title.to_lowercase())
    });

    Ok(tracks)
}
