#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::{Path, PathBuf};

use base64::Engine;
use lofty::{
    config::{ParseOptions, ParsingMode},
    file::{AudioFile, TaggedFileExt},
    probe::Probe,
    tag::Accessor,
};
use serde::Serialize;
use walkdir::WalkDir;

const SUPPORTED_EXTENSIONS: &[&str] = &[
    "flac",
    "mp3",
    "m4a",
    "mp4",
    "aac",
    "wav",
    "ogg",
    "oga",
    "opus",
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Track {
    id: String,
    path: String,

    title: String,
    artist: Option<String>,
    album: Option<String>,
    album_artist: Option<String>,

    genre: Option<String>,
    year: Option<i32>,

    track_number: Option<u32>,
    disc_number: Option<u32>,

    duration_ms: u64,

    format: String,

    artwork: Option<String>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from the Rust backend!", name)
}

#[tauri::command]
fn scan_music_library(path: String) -> Result<Vec<Track>, String> {
    let root = PathBuf::from(&path);

    if !root.exists() {
        return Err(format!(
            "Music folder does not exist: {}",
            root.display()
        ));
    }

    if !root.is_dir() {
        return Err(format!(
            "Selected path is not a directory: {}",
            root.display()
        ));
    }

    let mut tracks = Vec::new();

    for entry in WalkDir::new(&root)
        .follow_links(false)
        .into_iter()
        .filter_map(Result::ok)
    {
        let path = entry.path();

        if !entry.file_type().is_file() {
            continue;
        }

        if !is_supported_audio_file(path) {
            continue;
        }

        match read_track(path) {
            Ok(track) => {
                tracks.push(track);
            }

            Err(error) => {
                eprintln!(
                    "Metadata failed for '{}': {}",
                    path.display(),
                    error
                );

                /*
                 * Metadata is optional.
                 *
                 * Even if Lofty cannot parse a malformed FLAC/MP3 tag,
                 * the actual audio file should remain in the library.
                 */
                tracks.push(fallback_track(path));
            }
        }
    }

    tracks.sort_by(|a, b| {
        a.title
            .to_lowercase()
            .cmp(&b.title.to_lowercase())
    });

    Ok(tracks)
}

fn read_track(path: &Path) -> Result<Track, String> {
    /*
     * Relaxed mode is intentional here.
     *
     * Music players should be tolerant of imperfect metadata.
     * We don't want one broken timestamp/tag to invalidate the
     * entire audio file.
     *
     * read_cover_art(true) tells Lofty to actually parse embedded
     * artwork from supported tags.
     */
    let options = ParseOptions::new()
        .parsing_mode(ParsingMode::Relaxed)
        .read_cover_art(true);

    let tagged_file = Probe::open(path)
        .map_err(|error| {
            format!("Failed to open file: {}", error)
        })?
        .options(options)
        .read()
        .map_err(|error| {
            format!("Failed to parse audio file: {}", error)
        })?;

    let properties = tagged_file.properties();

    let duration_ms = properties
        .duration()
        .as_millis() as u64;

    let tag = tagged_file.primary_tag();

    /*
     * Try to find embedded artwork.
     *
     * Priority:
     *
     * 1. Front cover
     * 2. Any other embedded picture
     *
     * This is intentionally not limited to CoverFront because
     * some music files contain artwork with a different picture type.
     */
    let artwork = tag.and_then(|tag| {
        let picture = tag
            .pictures()
            .iter()
            .find(|picture| {
                matches!(
                    picture.pic_type(),
                    lofty::picture::PictureType::CoverFront
                )
            })
            .or_else(|| tag.pictures().first());

        let picture = picture?;

        let mime = picture
            .mime_type()
            .map(|mime| mime.to_string())
            .or_else(|| {
                Some(detect_image_mime(
                    picture.data(),
                ))
            })?;

        let encoded =
            base64::engine::general_purpose::STANDARD
                .encode(picture.data());

        Some(format!(
            "data:{};base64,{}",
            mime,
            encoded
        ))
    });

    let title = tag
        .and_then(|tag| tag.title())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| fallback_title(path));

    let artist = tag
        .and_then(|tag| tag.artist())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let album = tag
        .and_then(|tag| tag.album())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let genre = tag
        .and_then(|tag| tag.genre())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let year = tag
        .and_then(|tag| tag.year())
        .and_then(|value| i32::try_from(value).ok());

    let track_number =
        tag.and_then(|tag| tag.track());

    let disc_number =
        tag.and_then(|tag| tag.disk());

    Ok(Track {
        id: generate_track_id(path),

        path: path
            .to_string_lossy()
            .into_owned(),

        title,

        artist,
        album,

        /*
         * Keep this optional for now.
         *
         * We intentionally don't depend on ItemKey because
         * your installed Lofty version has API differences here.
         */
        album_artist: None,

        genre,
        year,

        track_number,
        disc_number,

        duration_ms,

        format: detect_format(path),

        artwork,
    })
}

fn fallback_track(path: &Path) -> Track {
    println!(
        "[Donya] using fallback metadata: {}",
        path.display()
    );

    Track {
        id: generate_track_id(path),

        path: path
            .to_string_lossy()
            .into_owned(),

        title: fallback_title(path),

        artist: None,
        album: None,
        album_artist: None,

        genre: None,
        year: None,

        track_number: None,
        disc_number: None,

        duration_ms: 0,

        format: detect_format(path),

        artwork: None,
    }
}

fn is_supported_audio_file(path: &Path) -> bool {
    let Some(extension) = path.extension() else {
        return false;
    };

    let extension = extension
        .to_string_lossy()
        .to_ascii_lowercase();

    SUPPORTED_EXTENSIONS
        .contains(&extension.as_str())
}

fn detect_format(path: &Path) -> String {
    let extension = path
        .extension()
        .map(|value| {
            value
                .to_string_lossy()
                .to_ascii_uppercase()
        })
        .unwrap_or_else(|| "UNKNOWN".to_string());

    match extension.as_str() {
        "FLAC" => "FLAC".to_string(),

        "MP3" => "MP3".to_string(),

        "M4A" | "MP4" => "M4A".to_string(),

        "AAC" => "AAC".to_string(),

        "WAV" => "WAV".to_string(),

        "OGG" | "OGA" => "OGG".to_string(),

        "OPUS" => "OPUS".to_string(),

        _ => extension,
    }
}

fn fallback_title(path: &Path) -> String {
    path.file_stem()
        .map(|value| {
            value
                .to_string_lossy()
                .trim()
                .to_string()
        })
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "Unknown track".to_string())
}

/*
 * Detect image MIME type when the embedded picture doesn't
 * provide a MIME type.
 *
 * This makes the artwork extraction a little more tolerant.
 */
fn detect_image_mime(data: &[u8]) -> String {
    if data.starts_with(&[
        0xFF, 0xD8, 0xFF,
    ]) {
        return "image/jpeg".to_string();
    }

    if data.starts_with(b"\x89PNG\r\n\x1a\n") {
        return "image/png".to_string();
    }

    if data.starts_with(b"GIF87a")
        || data.starts_with(b"GIF89a")
    {
        return "image/gif".to_string();
    }

    if data.len() >= 12
        && &data[0..4] == b"RIFF"
        && &data[8..12] == b"WEBP"
    {
        return "image/webp".to_string();
    }

    /*
     * JPEG is a reasonable fallback for unknown image data,
     * but ideally Lofty should provide the MIME type.
     */
    "image/jpeg".to_string()
}

fn generate_track_id(path: &Path) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{
        Hash,
        Hasher,
    };

    let mut hasher =
        DefaultHasher::new();

    path.to_string_lossy()
        .hash(&mut hasher);

    format!(
        "{:016x}",
        hasher.finish()
    )
}

#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_dialog::init(),
        )
        .plugin(
            tauri_plugin_opener::init(),
        )
        .invoke_handler(
            tauri::generate_handler![
                greet,
                scan_music_library
            ],
        )
        .run(
            tauri::generate_context!(),
        )
        .expect(
            "error while running tauri application",
        );
}
