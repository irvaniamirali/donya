import {
  FolderOpen,
  Music2,
} from "lucide-react";

type EmptyLibraryProps = {
  loading: boolean;
  error: string | null;
  onChooseFolder: () => void;
};

export function EmptyLibrary({
  loading,
  error,
  onChooseFolder,
}: EmptyLibraryProps) {
  return (
    <section className="empty-library">
      <div className="empty-library-content">
        <div className="empty-library-icon">
          <Music2
            size={28}
            strokeWidth={1.5}
          />
        </div>

        <span className="eyebrow">
          YOUR LIBRARY
        </span>

        <h1>
          Your music, your space.
        </h1>

        <p>
          Choose a folder containing
          your music. Donya will scan
          the files and build your
          local library.
        </p>

        <button
          className="primary-button"
          onClick={onChooseFolder}
          disabled={loading}
        >
          <FolderOpen size={17} />

          {loading
            ? "Scanning library..."
            : "Choose music folder"}
        </button>

        <span className="supported-formats">
          FLAC · MP3 · M4A · AAC · WAV ·
          OGG · OPUS
        </span>

        {error && (
          <div className="library-error">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
