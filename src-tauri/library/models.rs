use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Track {
    pub id: String,
    pub path: String,

    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub album_artist: Option<String>,

    pub genre: Option<String>,
    pub year: Option<u32>,

    pub track_number: Option<u32>,
    pub disc_number: Option<u32>,

    pub duration_ms: u64,

    pub format: AudioFormat,

    pub artwork: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum AudioFormat {
    Flac,
    Mp3,
    M4a,
    Aac,
    Wav,
    Ogg,
    Opus,
}

impl AudioFormat {
    pub fn from_extension(extension: &str) -> Option<Self> {
        match extension.to_ascii_lowercase().as_str() {
            "flac" => Some(Self::Flac),
            "mp3" => Some(Self::Mp3),
            "m4a" => Some(Self::M4a),
            "aac" => Some(Self::Aac),
            "wav" => Some(Self::Wav),
            "ogg" => Some(Self::Ogg),
            "opus" => Some(Self::Opus),
            _ => None,
        }
    }
}
